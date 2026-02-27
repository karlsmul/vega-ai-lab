// Health and observability module

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export class HealthTracker {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.startTime = Date.now();
    this.collectors = {};
    this.errors = [];
    this.signalsBeforeDedupe = 0;
    this.signalsAfterDedupe = 0;
    this.topicsCount = 0;
    this.opportunitiesCount = 0;
    this.analyzersOk = false;
    this.generatorsOk = false;
    this.steps = {};
  }

  recordCollector(name, count, ok) {
    this.collectors[name] = { count, ok };
  }

  recordError(message, stack) {
    this.errors.push({
      message,
      stack: stack ? stack.split('\n').slice(0, 3).join('\n') : null,
      timestamp: new Date().toISOString()
    });
  }

  recordStep(name, ok) {
    this.steps[name] = ok;
  }

  toJSON() {
    return {
      timestamp: new Date().toISOString(),
      runtime_seconds: Math.round((Date.now() - this.startTime) / 100) / 10,
      collectors: this.collectors,
      analyzers_ok: this.analyzersOk,
      generators_ok: this.generatorsOk,
      errors: this.errors,
      signals_before_dedupe: this.signalsBeforeDedupe,
      signals_after_dedupe: this.signalsAfterDedupe,
      topics_count: this.topicsCount,
      opportunities_count: this.opportunitiesCount,
      steps: this.steps,
    };
  }

  /**
   * Append a log line to .tmp/logs/run.log
   */
  log(message) {
    const logDir = join(this.rootDir, '.tmp', 'logs');
    mkdirSync(logDir, { recursive: true });
    const logPath = join(logDir, 'run.log');
    const line = `[${new Date().toISOString()}] ${message}\n`;
    try {
      appendFileSync(logPath, line);
    } catch {}
  }
}
