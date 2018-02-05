import Bacon from 'baconjs';
import fs from 'fs';
import path from 'path';
import CircularJSON from 'circular-json';
import { setInterval, clearInterval } from 'timers';

import parsePublication from './parsePublication';

const logPath = path.resolve(process.env.PWD, 'slogger.json');

const write = (Slogger) => (data) => {
  let transformed = data;
  switch (data.type) {
    case 'composite publication':
      transformed = parsePublication(data);
      break;
    default:
      break;
  }
  Slogger.bus.push(transformed);
};

const resetInterval = (Slogger) => {
  if (Slogger.flushTimer) {
    clearInterval(Slogger.flushTimer);
  }

  Slogger.flushTimer = setInterval(() => {
    console.info('flush queue interval triggered');
    Slogger.flushQueue();
  }, 30000);
};

const flushQueue = (Slogger) => () => {
  if (!Slogger.logQueue.length) {
    return;
  }
  console.info('flushing slogger queue');
  let jsonData;
  try {
    const currentData = fs.readFileSync(logPath);
    jsonData = JSON.parse(currentData);
  } catch (error) {
    jsonData = [];
  }

  while (Slogger.logQueue.length) {
    const log = Slogger.logQueue.shift();
    jsonData.push(log);
  }
  const outJson = CircularJSON.stringify(jsonData, null, 2);
  fs.writeFileSync(logPath, outJson);
  Slogger.queueLength = Slogger.logQueue.length;
  resetInterval(Slogger);
};

const createSlogger = () => {
  function Slogger() {
    this.bus = new Bacon.Bus();
    this.queueLength = 0;
    this.logQueue = [];

    this.busSub = this.bus.subscribe((val) => {
      this.logQueue.push(val);
      this.queueLength++;

      if (this.queueLength >= 100) {
        this.flushQueue();
      }
    });

    this.write = write(this);
    this.flushQueue = flushQueue(this);

    try {
      fs.unlinkSync(logPath);
    } catch (error) {
    }

    resetInterval(this);
  }
  return new Slogger();
};

Slogger = createSlogger();
