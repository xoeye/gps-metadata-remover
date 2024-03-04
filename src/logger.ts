enum LogLevel {
  Debug = "debug",
  Info = "info",
  Warn = "warn",
  Error = "error",
  None = "none", // Use this level to turn off logging
}

class Logger {
  static currentLevel: LogLevel = LogLevel.Info;

  static debug(message: string, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.Debug)) {
      console.debug(message, ...optionalParams);
    }
  }

  static info(message: string, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.Info)) {
      console.info(message, ...optionalParams);
    }
  }

  static warn(message: string, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.Warn)) {
      console.warn(message, ...optionalParams);
    }
  }

  static error(message: string, ...optionalParams: any[]) {
    if (this.shouldLog(LogLevel.Error)) {
      console.error(message, ...optionalParams);
    }
  }

  private static shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentLevelIndex = levels.indexOf(this.currentLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }
}

export { Logger, LogLevel };
