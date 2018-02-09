const createSubManager = () => {
  function PartupSubscriptionManager() {

    this.partups = new SubsManager({
      cacheLimit: 5,
      expireIn: 10,
    });

    this.updates = new SubsManager({
      cacheLimit: 10,
      expireIn: 5,
    });

    this.boards = new SubsManager({
      cacheLimit: 10,
      expireIn: 5,
    });

    this.activities = new SubsManager({
      cacheLimit: 10,
      expireIn: 5,
    });

    return this;
  }

  return new PartupSubscriptionManager();
}

subManager = createSubManager();