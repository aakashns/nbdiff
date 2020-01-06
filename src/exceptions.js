export class NotifyUserError extends Error {
  constructor(message, severity = "error") {
    super(message);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, NotifyUserError.prototype);
    this.message = message;
    this.stack = new Error().stack;
    this.severity = severity;
  }
}
