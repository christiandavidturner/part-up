import * as Bacon from 'baconjs';
import { IDisposable } from 'lib/interfaces/IDisposable';

export type SuggesterOptions<T> = {
  inputStreamMapper: (arg: JQueryEventObject) => string;
  queryResolver: (arg: string) => Bacon.EventStream<ErrorEvent, Array<T>>;
};

export class Suggester<T> implements IDisposable {
  private _disposed: boolean;

  private _inputStream: Bacon.EventStream<ErrorEvent, string>;
  private _suggestionStream: Bacon.EventStream<ErrorEvent, Array<T>>;

  // private _prefill: (arg: T) => void;

  public get suggestionStream() {
    return this._suggestionStream;
  }

  // public get prefill() {
  //   return this._prefill;
  // }

  constructor(DOMNode: HTMLInputElement | HTMLTextAreaElement, options: SuggesterOptions<T>) {
    const { inputStreamMapper, queryResolver } = options;

    this._inputStream =
      Bacon
        .fromEvent<ErrorEvent, JQueryEventObject>(DOMNode, 'input')
        .debounce(200)
        .map(inputStreamMapper)
        .skipDuplicates();

    this._suggestionStream = this._inputStream.flatMapLatest(queryResolver);

    // // Dummy;
    // this._prefill = () => void 0;
  }

  public dispose() {
    if (this._disposed) {
      return;
    }

    // No clue if this works, need to check for possible memory leaks.
    this._inputStream.doAction((_) => Bacon.noMore);
    this._suggestionStream.doAction((_) => Bacon.noMore);
    this._disposed = true;
  }
}
