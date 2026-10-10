import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess } from '../utils/response';

export const getDashboardSummary = async (req: Request, res: Response) => {
  const organizationId = req.user!.organizationId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // 1. Fabric Stock Summary
  const fabricBatches = await prisma.fabricBatch.findMany({
    where: { organizationId },
    select: {
      weightKg: true,
      wastageKg: true,
      lengthMeters: true,
      costPerUnit: true,
    },
  });

  const fabricStats = fabricBatches.reduce(
    (acc, b) => {
      const netKg = Math.max(0, b.weightKg - b.wastageKg);
      acc.totalWeightKg += netKg;
      acc.totalWastageKg += b.wastageKg;
      acc.totalLengthMeters += b.lengthMeters || 0;
      acc.totalValuePkr += b.weightKg * b.costPerUnit;
      return acc;
    },
    { totalWeightKg: 0, totalWastageKg: 0, totalLengthMeters: 0, totalValuePkr: 0 }
  );

  // 2. Finished Goods Total Count & Low-Stock Variants
  const variants = await prisma.productVariant.findMany({
    where: { organizationId },
    include: {
      product: true,
      stockItems: true,
    },
  });

  let finishedGoodsCount = 0;
  const lowStockItems: any[] = [];

  variants.forEach((v) => {
    const stockQty = v.stockItems.reduce((sum, item) => sum + item.quantity, 0);
    finishedGoodsCount += stockQty;
    if (stockQty <= v.reorderLevel) {
      lowStockItems.push({
        id: v.id,
        sku: v.sku,
        productName: v.product.name,
        size: v.size,
        color: v.color,
        currentStock: stockQty,
        reorderLevel: v.reorderLevel,
      });
    }
  });

  // 3. Orders Statistics
  const allOrders = await prisma.order.findMany({
    where: { organizationId },
    include: {
      items: {
        include: {
          variant: { include: { product: true } },
        },
      },
      customer: true,
      payments: true,
    },
  });

  let openOrdersCount = 0;
  let openOrdersValue = 0;
  let thisMonthSales = 0;
  let totalReceivables = 0;

  allOrders.forEach((order) => {
    // Open orders
    if (['DRAFT', 'CONFIRMED', 'PACKED', 'DISPATCHED'].includes(order.status)) {
      openOrdersCount += 1;
      openOrdersValue += order.totalAmount;
    }

    // Receivables (non-cancelled orders with unpaid balances)
    if (order.status !== 'CANCELLED') {
      const remaining = Math.max(0, order.totalAmount - order.paidAmount);
      totalReceivables += remaining;

      // Sales this month
      if (order.createdAt >= startOfMonth) {
        thisMonthSales += order.totalAmount;
      }
    }
  });

  // 4. Top Selling Products & Sizes Breakdown
  const productSalesMap = new Map<string, { name: string; category: string; units: number; revenue: number }>();
  const sizeSalesMap = new Map<string, number>();

  allOrders
    .filter((o) => o.status !== 'CANCELLED')
    .forEach((order) => {
      order.items.forEach((item) => {
        const prodName = item.variant.product.name;
        const currentProd = productSalesMap.get(prodName) || {
          name: prodName,
          category: item.variant.product.category,
          units: 0,
          revenue: 0,
        };
        currentProd.units += item.quantity;
        currentProd.revenue += item.lineTotal;
        productSalesMap.set(prodName, currentProd);

        // Size popularity
        const curSizeUnits = sizeSalesMap.get(item.variant.size) || 0;
        sizeSalesMap.set(item.variant.size, curSizeUnits + item.quantity);
      });
    });

  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.units - a.units)
    .slice(0, 6);

  const popularSizes = Array.from(sizeSalesMap.entries())
    .map(([size, units]) => ({ size, units }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 6);

  // 5. Top Customers by Revenue
  const customerSalesMap = new Map<string, { id: string; name: string; city: string; type: string; totalBilled: number; totalPaid: number; outstanding: number }>();

  allOrders
    .filter((o) => o.status !== 'CANCELLED')
    .forEach((order) => {
      const cId = order.customerId;
      const c = customerSalesMap.get(cId) || {
        id: cId,
        name: order.customer.name,
        city: order.customer.city,
        type: order.customer.type,
        totalBilled: 0,
        totalPaid: 0,
        outstanding: 0,
      };
      c.totalBilled += order.totalAmount;
      c.totalPaid += order.paidAmount;
      c.outstanding += Math.max(0, order.totalAmount - order.paidAmount);
      customerSalesMap.set(cId, c);
    });

  const topCustomers = Array.from(customerSalesMap.values())
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, 6);

  // 6. 6-Month Sales Trend
  const monthlyTrend: { month: string; sales: number; count: number }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthLabel = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;

    const ordersInMonth = allOrders.filter(
      (o) => o.status !== 'CANCELLED' && o.createdAt >= d && o.createdAt < nextD
    );

    const monthSales = ordersInMonth.reduce((sum, o) => sum + o.totalAmount, 0);

    monthlyTrend.push({
      month: monthLabel,
      sales: monthSales,
      count: ordersInMonth.length,
    });
  }

  // 7. Stock-flow counts (Fabric batches / WIP estimated / Finished goods / Damaged or Returned)
  const movements = await prisma.stockMovement.findMany({
    where: { organizationId },
    select: { type: true, quantity: true },
  });

  const stockFlow = {
    fabricRolls: fabricBatches.length,
    fabricWeightKg: Math.round(fabricStats.totalWeightKg),
    finishedGoodsUnits: finishedGoodsCount,
    returnsCount: movements.filter((m) => m.type === 'RETURN').reduce((s, m) => s + m.quantity, 0),
    damagedCount: movements.filter((m) => m.type === 'DAMAGED').reduce((s, m) => s + m.quantity, 0),
  };

  return sendSuccess(res, {
    kpis: {
      fabricStockKg: Math.round(fabricStats.totalWeightKg),
      fabricStockValuePkr: Math.round(fabricStats.totalValuePkr),
      finishedGoodsCount,
      openOrdersCount,
      openOrdersValuePkr: Math.round(openOrdersValue),
      thisMonthSalesPkr: Math.round(thisMonthSales),
      outstandingReceivablesPkr: Math.round(totalReceivables),
    },
    stockFlow,
    topSellingProducts,
    popularSizes,
    topCustomers,
    lowStockItems,
    monthlyTrend,
  });
};
