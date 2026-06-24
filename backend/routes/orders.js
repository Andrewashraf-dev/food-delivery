const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const DeliveryRegion = require('../models/DeliveryRegion');
const { protect } = require('../middleware/auth');
const { getComboById } = require('../constants/sandwichCombos');
const { sumValidatedAddons } = require('../helpers/addons');
const {
  validateCustomerInfo,
  validateOrderItems,
  validatePaymentMethod,
  validateOrderType,
} = require('../helpers/validation');

router.post(
  '/',
  protect,
  [
    body('customerInfo.name').notEmpty().withMessage('Name is required'),
    body('customerInfo.phone').notEmpty().withMessage('Phone number is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg || 'Validation failed',
      });
    }

    try {
      const {
        customerInfo,
        items,
        paymentMethod,
        orderType,
        notes,
        customNotes,
        deliveryRegionId,
        deliveryLocation,
      } = req.body;

      const customerValidation = validateCustomerInfo(customerInfo);
      if (!customerValidation.valid) {
        return res.status(400).json({ success: false, error: customerValidation.error });
      }

      const itemsValidation = validateOrderItems(items);
      if (!itemsValidation.valid) {
        return res.status(400).json({ success: false, error: itemsValidation.error });
      }

      const paymentValidation = validatePaymentMethod(paymentMethod);
      if (!paymentValidation.valid) {
        return res.status(400).json({ success: false, error: paymentValidation.error });
      }

      const orderTypeValidation = validateOrderType(orderType);
      if (!orderTypeValidation.valid) {
        return res.status(400).json({ success: false, error: orderTypeValidation.error });
      }

      const ot = String(orderType).toLowerCase();
      let regionId = deliveryRegionId != null ? parseInt(deliveryRegionId, 10) : null;
      let deliveryFee = 0;

      if (ot === 'delivery') {
        if (!regionId || Number.isNaN(regionId)) {
          return res.status(400).json({ success: false, error: 'Please select a delivery region.' });
        }
        const fee = await DeliveryRegion.getFee(regionId);
        if (fee == null || Number.isNaN(Number(fee))) {
          return res.status(400).json({ success: false, error: 'Invalid delivery region.' });
        }
        deliveryFee = Number(fee);

        const lat = deliveryLocation?.lat != null ? Number(deliveryLocation.lat) : null;
        const lng = deliveryLocation?.lng != null ? Number(deliveryLocation.lng) : null;
        if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) {
          return res.status(400).json({ success: false, error: 'Please pin your location on the map.' });
        }
      } else {
        regionId = null;
      }

      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const menuItemId = parseInt(item.menuItem, 10);
        if (Number.isNaN(menuItemId)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid menu item ID.',
          });
        }

        const menuItem = await MenuItem.findRawById(menuItemId);
        if (!menuItem || !menuItem.is_available) {
          return res.status(400).json({
            success: false,
            error: `Item "${item.name}" is no longer available. Please refresh and try again.`,
          });
        }

        const basePrice = parseFloat(menuItem.price);
        const quantity = parseInt(item.quantity, 10);

        if (quantity < 1 || quantity > 1000) {
          return res.status(400).json({
            success: false,
            error: `Invalid quantity for ${item.name}.`,
          });
        }

        let addonSum = 0;
        try {
          addonSum = sumValidatedAddons(menuItem, item.selectedAddons || item.selectedAddonNames);
        } catch (e) {
          return res.status(e.statusCode || 400).json({ success: false, error: e.message });
        }

        let comboAdd = 0;
        let comboLabel = null;
        const comboId = item.comboId || item.comboKey || null;
        if (comboId) {
          if (menuItem.category !== 'Sandwiches') {
            return res.status(400).json({
              success: false,
              error: 'Combo options apply to sandwiches only.',
            });
          }
          const combo = getComboById(comboId);
          if (!combo) {
            return res.status(400).json({ success: false, error: 'Invalid combo selection.' });
          }
          comboAdd = combo.priceAdd;
          comboLabel = combo.labelEn;
        }

        const unitPrice = basePrice + addonSum + comboAdd;
        const itemSubtotal = unitPrice * quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          menuItem: menuItem.id,
          name: item.name,
          price: unitPrice,
          quantity,
          subtotal: itemSubtotal,
          comboSelection: comboLabel,
          customNotes: item.itemNote || item.customNotes || null,
        });
      }

      const total = subtotal + deliveryFee;

      if (total <= 0 || total > 100000) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order total',
        });
      }

      const order = await Order.create({
        customerInfo: {
          name: customerInfo.name,
          email: customerInfo.email || null,
          phone: customerInfo.phone,
          address: customerInfo.address,
        },
        items: orderItems,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: paymentMethod || 'cod',
        orderType: ot,
        notes: notes || '',
        customNotes: customNotes || null,
        userId: req.user?.id || null,
        deliveryRegionId: regionId,
        deliveryLat: ot === 'delivery' ? deliveryLocation?.lat : null,
        deliveryLng: ot === 'delivery' ? deliveryLocation?.lng : null,
      });

      res.status(201).json({
        success: true,
        message: 'Order received!',
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
          total: order.total,
        },
      });
    } catch (err) {
      console.error('Order Route Error:', err);
      res.status(500).json({
        success: false,
        error: 'Failed to place order. Please try again later.',
      });
    }
  }
);

router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.findByUserId(req.user.id);
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('Error fetching user orders:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your orders. Please try again later.',
    });
  }
});

router.get('/track/:orderNumber', async (req, res) => {
  try {
    const order = await Order.findByNumber(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found. Please check the order number and try again.',
      });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    console.error('Error tracking order:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to track order. Please try again later.',
    });
  }
});

module.exports = router;
