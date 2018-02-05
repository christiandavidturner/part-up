import CircularJSON from 'circular-json';
import { get } from 'lodash';

/* eslint-disable no-var */
var parseServer = (server) => {
  if (typeof(server) === 'string') {
    return server;
  }

  const {
    publish_handlers,
    universal_publish_handlers,
    sessions,
  } = server;

  const parsedSessions = {};
  Object.keys(sessions).forEach((key) => {
    parsedSessions[key] = parseSession(sessions[key]);
  });

  return {
    publish_handlers,
    universal_publish_handlers,
    sessions: parsedSessions,
  };
};

var parseSession = (session) => {
  if (typeof(session) === 'string') {
    return session;
  }

  const {
    id,
    userId,
    initialized,
    blocked,
    workerRunning,
    _isSending: isSending,
    inQueue,
    _namedSubs,
    _universalSubs,
    collectionViews,
    server,
  } = session;

  const parsedNamedSubs = {};
  Object.keys(_namedSubs).forEach((key) => {
    parsedNamedSubs[key] = parsePublication(_namedSubs[key]);
  });

  const parsedUniversalSubs = [];
  if (Array.isArray(_universalSubs)) {
    _universalSubs.forEach((sub) => {
      parsedUniversalSubs.push(parsePublication(sub));
    });
  }

  return {
    id,
    userId,
    initialized,
    blocked,
    workerRunning,
    isSending,
    inQueue,
    namedSubs: parsedNamedSubs,
    universalSubs: parsedUniversalSubs.length ? parsedUniversalSubs : _universalSubs,
    collectionViews,
    server: parseServer(server),
  };
};

var parsePublication = (pub) => {
  const ps = get(pub, 'data.self', undefined);
  if (!ps) {
    return pub;
  }

  // This is required because of circular deps.. dont want to spend time in writing an algorithm.
  const pubSelf = JSON.parse(CircularJSON.stringify(pub.data.self));

  const {
    _subscriptionId: subscriptionId,
    _subscriptionHandle: subscriptionHandle,
    userId,
    _name: name,
    _params: params,
    _ready: ready,
    _deactivated: deactivated,
    _session: session,
  } = pubSelf;

  pub.data.self = {
    subscriptionId,
    subscriptionHandle,
    userId,
    name,
    params,
    ready,
    deactivated,
    session: parseSession(session),
  };

  return pub;
};

export default parsePublication;
