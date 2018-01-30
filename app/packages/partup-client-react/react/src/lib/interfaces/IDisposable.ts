/**
 * IDisposable interface
 *
 * @export
 * @interface IDisposable
 * @description Object implementing the IDisposable object handle leaky stuff, be sure to always call dispose() when done
 * @example
 * class Leaky implements IDisposable {
 *   private disposed: boolean;
 *
 *   private baconStream: Bacon.EventStream;
 *
 *   public dispose() {
 *     if (this.disposed) {
 *       return;
 *     }
 *
 *     this.baconStream.doAction((_) => Bacon.noMore);
 *   }
 * }
 */
export interface IDisposable {
  dispose: () => void;
}
