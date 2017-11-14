Event.on('partups.inserted', function(userId, partup) {
    if (!userId) return;

    // Store new tags into collection
    Partup.services.tags.insertNewTags(partup.tags);

    // Add language to collection if new
    Partup.server.services.language.addNewLanguage(partup.language);

    // "User created this part-up" update
    var update_created = Partup.factories.updatesFactory.make(userId, partup._id, 'partups_created', {});
    Updates.insert(update_created);

    // "System message" update
    var update_systemmessage = Partup.factories.updatesFactory.makeSystem(partup._id, 'partups_message_added', {
        type: 'welcome_message'
    });
    Updates.insert(update_systemmessage);

    // If the Partup has been created in a Network, notify its specific users
    if (partup.network_id) {
        var network = Networks.findOneOrFail(partup.network_id);
        var creator = Meteor.users.findOneOrFail(userId);
        var recipients = network.admins; // Always send to admins

        if (partup.privacy_type == Partups.privacy_types.NETWORK_PUBLIC ||
            partup.privacy_type == Partups.privacy_types.NETWORK_INVITE ||
            partup.privacy_type == Partups.privacy_types.NETWORK_CLOSED
        ) {
            // Add all network uppers
            recipients.push.apply(recipients, network.uppers);
        } else {
            if (partup.privacy_type >= Partups.privacy_types.NETWORK_COLLEAGUES) {
                // Add colleagues
                recipients.push.apply(recipients, network.colleagues);
            }
            if (partup.privacy_type >= Partups.privacy_types.NETWORK_COLLEAGUES_CUSTOM_A) {
                // Add custom A uppers
                recipients.push.apply(recipients, network.colleagues_custom_a);
            }
            if (partup.privacy_type >= Partups.privacy_types.NETWORK_COLLEAGUES_CUSTOM_B) {
                // Add custom B uppers
                recipients.push.apply(recipients, network.colleagues_custom_b);
            }
        }

        lodash.uniq(recipients || []).forEach(function(upperId) {
            // Don't send a notification to the creator of the partup
            if (upperId === creator._id) return;
            var upper = Meteor.users.findOne(upperId);
            if (!User(upper).isActive()) return; // Ignore deactivated accounts

            // Set the notification details
            var notificationOptions = {
                userId: upper._id,
                type: 'partup_created_in_network',
                typeData: {
                    creator: {
                        _id: creator._id,
                        name: creator.profile.name,
                        image: creator.profile.image
                    },
                    network: {
                        name: network.name
                    },
                    partup: {
                        _id: partup._id,
                        name: partup.name,
                        slug: partup.slug
                    }
                }
            };

            // Send the notification
            Partup.server.services.notifications.send(notificationOptions);

            // Set the email details
            var emailOptions = {
                type: 'partup_created_in_network',
                toAddress: User(upper).getEmail(),
                subject: TAPi18n.__('emails-partup_created_in_network-subject', {network: network.name}, User(upper).getLocale()),
                locale: User(upper).getLocale(),
                typeData: {
                    name: User(upper).getFirstname(),
                    creatorName: creator.profile.name,
                    partupName: partup.name,
                    networkName: network.name,
                    url: Meteor.absoluteUrl() + 'partups/' + partup.slug,
                    unsubscribeOneUrl: Meteor.absoluteUrl() + 'unsubscribe-email-one/partup_created_in_network/' + upper.profile.settings.unsubscribe_email_token,
                    unsubscribeAllUrl: Meteor.absoluteUrl() + 'unsubscribe-email-all/' + upper.profile.settings.unsubscribe_email_token
                },
                userEmailPreferences: upper.profile.settings.email
            };

            // Send the email
            Partup.server.services.emails.send(emailOptions, upper);
        });
    }
});

Event.on('partups.updated', function(userId, partup, fields) {
    // Store new tags into collection
    Partup.services.tags.insertNewTags(partup.tags);

    // Add language to collection if new
    Partup.server.services.language.addNewLanguage(partup.language);
});

Event.on('partups.archived', function(userId, partup) {
    // "User archived this part-up" update
    var update_archived = Partup.factories.updatesFactory.make(userId, partup._id, 'partups_archived', {});
    Updates.insert(update_archived);

    var archiver = Meteor.users.findOneOrFail(userId);

    var notify_uppers = partup.uppers || [];
    var partup_supporters = partup.supporters || [];
    notify_uppers.push.apply(notify_uppers, partup_supporters);

    notify_uppers.forEach(function(upperId) {
        // Dont send a notification to the archiver of the partup
        if (upperId === userId) return;

        var upper = Meteor.users.findOneOrFail(upperId);

        // Set the notification details
        var notificationOptions = {
            userId: upper._id,
            type: 'partups_archived',
            typeData: {
                archiver: {
                    _id: archiver._id,
                    name: archiver.profile.name,
                    image: archiver.profile.image
                },
                partup: {
                    _id: partup._id,
                    name: partup.name,
                    slug: partup.slug
                }
            }
        };

        // Send the notification
        Partup.server.services.notifications.send(notificationOptions);
    });
});

Event.on('partups.unarchived', function(userId, partup) {
    // "User unarchived this part-up" update
    var update_unarchived = Partup.factories.updatesFactory.make(userId, partup._id, 'partups_unarchived', {});
    Updates.insert(update_unarchived);

    var unarchiver = Meteor.users.findOneOrFail(userId);

    var notify_uppers = partup.uppers || [];
    var partup_supporters = partup.supporters || [];
    notify_uppers.push.apply(notify_uppers, partup_supporters);

    notify_uppers.forEach(function(upperId) {
        // Dont send a notification to the unarchiver of the partup
        if (upperId === userId) return;

        var upper = Meteor.users.findOneOrFail(upperId);

        // Set the notification details
        var notificationOptions = {
            userId: upper._id,
            type: 'partups_unarchived',
            typeData: {
                unarchiver: {
                    _id: unarchiver._id,
                    name: unarchiver.profile.name,
                    image: unarchiver.profile.image
                },
                partup: {
                    _id: partup._id,
                    name: partup.name,
                    slug: partup.slug
                }
            }
        };

        // Send the notification
        Partup.server.services.notifications.send(notificationOptions);
    });
});

Event.on('partups.privacy_type_changed', function(userId, partup, oldPrivacyType, newPrivacyType) {
    // Only notify on network partups
    if (!partup.network_id) return;

    var network = Networks.findOneOrFail(partup.network_id);
    var creator = Meteor.users.findOneOrFail(userId);
    var recipients = [];

    if (oldPrivacyType == Partups.privacy_types.NETWORK_PUBLIC ||
        oldPrivacyType == Partups.privacy_types.NETWORK_INVITE ||
        oldPrivacyType == Partups.privacy_types.NETWORK_CLOSED
    ) {
        // All uppers have already been notified
        return;
    } else if (newPrivacyType == Partups.privacy_types.NETWORK_PUBLIC ||
        newPrivacyType == Partups.privacy_types.NETWORK_INVITE ||
        newPrivacyType == Partups.privacy_types.NETWORK_CLOSED
    ) {
        // Add all uppers
        recipients.push.apply(recipients, network.uppers);
        // Remove admins
        recipients = lodash.difference(recipients, network.admins);

        if (oldPrivacyType >= Partups.privacy_types.NETWORK_COLLEAGUES) {
            recipients = lodash.difference(recipients, network.colleagues);
        }
        if (oldPrivacyType >= Partups.privacy_types.NETWORK_COLLEAGUES_CUSTOM_A) {
            recipients = lodash.difference(recipients, network.colleagues_custom_a);
        }
        if (oldPrivacyType >= Partups.privacy_types.NETWORK_COLLEAGUES_CUSTOM_B) {
            recipients = lodash.difference(recipients, network.colleagues_custom_b);
        }
    } else {
        // If the new type is more secure, everybody is already notified when the partup was created
        if (newPrivacyType > Partups.privacy_types.NETWORK_CLOSED && newPrivacyType <= oldPrivacyType) return;

        // Admins have already been notified
        if (newPrivacyType == Partups.privacy_types.NETWORK_ADMINS) return;

        // From here, only less secure partups are possible, so we need to notify uppers from other privacy groups
        if (newPrivacyType == Partups.privacy_types.NETWORK_COLLEAGUES_CUSTOM_B) {
            // Add custom B uppers
            recipients.push.apply(recipients, network.colleagues_custom_b);

            if (oldPrivacyType < Partups.privacy_types.NETWORK_COLLEAGUES_CUSTOM_A) {
                // Add custom A uppers
                recipients.push.apply(recipients, network.colleagues_custom_a);
            }
            if (oldPrivacyType < Partups.privacy_types.NETWORK_COLLEAGUES) {
                // Add colleague uppers
                recipients.push.apply(recipients, network.colleagues);
            }
        } else if (newPrivacyType == Partups.privacy_types.NETWORK_COLLEAGUES_CUSTOM_A) {
            // Add custom A uppers
            recipients.push.apply(recipients, network.colleagues_custom_a);

            if (oldPrivacyType < Partups.privacy_types.NETWORK_COLLEAGUES) {
                // Add colleague uppers
                recipients.push.apply(recipients, network.colleagues);
            }
        } else if (newPrivacyType == Partups.privacy_types.NETWORK_COLLEAGUES) {
            // Add colleagues
            recipients.push.apply(recipients, network.colleagues);
        }
    }

    recipients.forEach(function(upperId) {
        // Don't send a notification to the creator of the partup
        if (upperId === creator._id) return;
        var upper = Meteor.users.findOne(upperId);
        if (!User(upper).isActive()) return; // Ignore deactivated accounts

        // Set the notification details
        var notificationOptions = {
            userId: upper._id,
            type: 'partup_created_in_network',
            typeData: {
                creator: {
                    _id: creator._id,
                    name: creator.profile.name,
                    image: creator.profile.image
                },
                network: {
                    name: network.name
                },
                partup: {
                    _id: partup._id,
                    name: partup.name,
                    slug: partup.slug
                }
            }
        };

        // Send the notification
        Partup.server.services.notifications.send(notificationOptions);

        // Set the email details
        var emailOptions = {
            type: 'partup_created_in_network',
            toAddress: User(upper).getEmail(),
            subject: TAPi18n.__('emails-partup_created_in_network-subject', {network: network.name}, User(upper).getLocale()),
            locale: User(upper).getLocale(),
            typeData: {
                name: User(upper).getFirstname(),
                creatorName: creator.profile.name,
                partupName: partup.name,
                networkName: network.name,
                url: Meteor.absoluteUrl() + 'partups/' + partup.slug,
                unsubscribeOneUrl: Meteor.absoluteUrl() + 'unsubscribe-email-one/partup_created_in_network/' + upper.profile.settings.unsubscribe_email_token,
                unsubscribeAllUrl: Meteor.absoluteUrl() + 'unsubscribe-email-all/' + upper.profile.settings.unsubscribe_email_token
            },
            userEmailPreferences: upper.profile.settings.email
        };

        // Send the email
        Partup.server.services.emails.send(emailOptions, upper);
    });
});
