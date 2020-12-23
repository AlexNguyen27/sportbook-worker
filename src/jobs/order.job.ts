import cron from 'node-cron';
import moment from 'moment';
import { logger } from 'juno-js';
import OrderService from '../services/order.service';
import { redis } from '../components/redis';
import { ORDER_STATUS } from '../components/constants';

const checkOutOfTime = (startDay: any, endTime: any) => {
  const day = `${startDay} ${endTime}`;
  return moment().isAfter(day);
};

class OrderJob {
  static catchMounse() {
    // FOR AUTO FINISHED OR CANCELLED TASK
    cron.schedule('*/10 * * * *', async () => {
      const orders = await OrderService.getOrders({ outOfTime: true });

      orders.forEach(async (order: any) => {
        const isOutOfTime = checkOutOfTime(order.startDay, order.endTime);
        console.log('isOutOfTime, ', isOutOfTime);
        if (isOutOfTime) {
          if (order.status === ORDER_STATUS.approved) {
            await OrderService.updateStatus(order.id, ORDER_STATUS.cancelled);
          } else {
            await OrderService.updateStatus(order.id, ORDER_STATUS.finished);
          }
        }
      });
      console.log('outOfTime, running a task every 10 minutes');
    });

    // FOR USER CREATE NEW ORDER
    cron.schedule('*/10 * * * *', async () => {
      const orders = await OrderService.getOrders({ status: ORDER_STATUS.waiting_for_approve, attributes: ['id', 'status'] });

      // MAP ALL ORDER ID AND CHECK IF ORDER ID DONT HAVE IN REDIS
      // => CHANGE STATUS TO CANCELLED
      // EX IS 30m
      try {
        orders.forEach((order) => {
          redis.get(order.id, async (err: any, result: any) => {
            if (err) {
              console.log('error-------------', err);
            } else if (!result) {
              console.log('result-------------', result);
              await OrderService.updateStatus(order.id, ORDER_STATUS.cancelled);
            }
          });
        });
      } catch (error) {
        console.log('error------------------', error);
      }
      console.log('waiting_for_approve, running a task every 10 minutes');
    });
  }
}

export default OrderJob;
