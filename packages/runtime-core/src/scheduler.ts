const queue = [];
let isFlushing = false;

const p = Promise.resolve();
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job); // 存储当前更新的操作
  }

  // 数据变化更 可能会出现多个组件的更新，所有需要采用队列来存储

  if (!isFlushing) {
    isFlushing = true; // 通过批处理来实现的
    p.then(() => {
      isFlushing = false;
      let copyQueue = queue.slice(0); // 将当前要执行的队列拷贝一份，并且清空队列
      queue.length = 0;

      copyQueue.forEach((job) => {
        job();
      });
      copyQueue.length = 0;
    });
  }
}
// 浏览器的事件环、一轮一轮的实现
