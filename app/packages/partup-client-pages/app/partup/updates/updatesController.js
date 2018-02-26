import { get, isFunction } from 'lodash';

class UpdatesController {
  constructor({ partupId, limit = 10, filter = undefined }) {
    const self = this;
    this.initialized = new ReactiveVar(false);
    this.partupId = partupId;

    this.previousRefreshDate = this.refreshDate = new Date();
    this.startingLimit = limit;
    this.loading = new ReactiveVar(false);
    this.loadingMore = new ReactiveVar(false);
    this.endReached = new ReactiveVar(false);

    this.limit = new ReactiveVar(this.startingLimit, (oldLimit, newLimit) => {
      if (this.endReached.curValue) {
        return true;
      }
      if (oldLimit !== newLimit) {
        this.updateCursor(newLimit, this.filter.curValue);
        this.fetch();
      }
    });

    this.filter = new ReactiveVar(filter, (oldFilter, newFilter) => {
      if (oldFilter !== newFilter) {
        this.endReached.set(false);
        this.updateCursor(this.startingLimit, newFilter);
        this.fetch();
      }
    });

    this.updates = new ReactiveVar([], (oldUpdates, newUpdates) => {
      if (newUpdates.length < this.limit.curValue) {
        this.endReached.set(true);
      } else {
        this.endReached.set(false);
      }
    });

    this.newUpdateCount = new ReactiveVar(0);

    this.cursor = Updates.findForPartup(partupId, { limit, filter });
    this.cursor.observeChanges({
      addedBefore(id, doc, before) {
        if (self.initialized.curValue) {
          // Before will be null when an update is removed, in that case the new update is placed at the bottom of the list to fill up the limit
          if (before === null) {
            self.fetch();
          // Check if the new document is a brand new message caused by the current increase the limit by 1 which will immediatly display the new update
          } else if (
            (doc.upper_id === Meteor.userId() && moment(doc.created_at).diff(self.refreshDate))
          ) {
            self.endReached.set(false);
            self.increaseLimit(1);
          } else {
            self.endReached.set(false);
            self.newUpdateCount.set(self.newUpdateCount.curValue + 1);
          }
        }
      },
    });

    this.subCount = 0;
    this.subLimitStep = 50;
    this.autorunComputation;

    let subHandle;
    Tracker.autorun((computation) => {

      // Store the computation so the tracker can be stopped when 'dispose' is called
      this.autorunComputation = computation;
      const currentLimit = this.limit.get();

      // endReached is used to tell we should stop caring about the increasing limit request by the user
      // loadingMore is used to skip creating duplicate subs
      if (!this.loading.curValue && ((currentLimit >= this.subLimitStep * this.subCount) && !this.endReached.curValue && !this.loadingMore.curValue)) {
        if (this.initialized.curValue) {
          this.loadingMore.set(true);
        } else {
          this.loading.set(true);
        }

        const skip = this.subCount * this.subLimitStep;
        const limit = this.subLimitStep;

        subHandle = subManager.updates.subscribe(
          'updates.from_partup',
          partupId,
          {
            skip,
            limit,
            filter,
          }
        );
      }

      if (isFunction(get(subHandle, 'ready')) && subHandle.ready()) {
        subHandle = null;
        this.subCount++;
        this.fetch();

        if (!this.initialized.curValue) {
          setTimeout(() => {
            this.loading.set(false);
            this.initialized.set(true);
          });
        } else {
          this.loadingMore.set(false);
        }
      }
    });
  }

  increaseLimit(inc = 15) {
    this.previousRefreshDate = this.refreshDate;
    this.limit.set(this.limit.curValue + inc);
  }

  updateCursor(limit, filter) {
    this.cursor = Updates.findForPartup(this.partupId, { limit, filter });
  }

  fetch() {
    this.refreshDate = new Date();
    this.updates.set(this.cursor.fetch());
  }

  dispose() {
    this.updates.set([]);
    if (isFunction(get(this.autorunComputation, 'stop'))) {
      this.autorunComputation.stop();
    }
  }
}

export default UpdatesController;
