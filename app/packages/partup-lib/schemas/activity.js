/**
 * Base Activity schema
 * @name activityBaseSchema
 * @memberof Partup.schemas
 * @private
 */
var activityBaseSchema = new SimpleSchema({
    name: {
        type: String,
        max: 60,
        min: 1,
    },
    description: {
        type: String,
        max: 1000,
        optional: true,
    },
    end_date: {
        type: Date,
        optional: true,
    },
    lane_id: {
        type: String,
        optional: true,
        regEx: SimpleSchema.RegEx.Id
    },
    files: {
        type: Object,
        optional: true,
    },
    'files.documents': {
        type: [String],
        optional: true,
    },
    'files.images': {
        type: [String],
        optional: true,
    },
});

/**
 * Activity entity schema
 * @name activity
 * @memberof Partup.schemas.entities
 */
Partup.schemas.entities.activity = new SimpleSchema([activityBaseSchema, {
    _id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    created_at: {
        type: Date,
        defaultValue: new Date()
    },
    creator_id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    archived: {
        type: Boolean,
        defaultValue: false
    },
    update_id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    partup_id: {
        type: String,
        regEx: SimpleSchema.RegEx.Id
    },
    updated_at: {
        type: Date,
        defaultValue: new Date()
    }
}]);

/**
 * Activity form schema
 * @name startActivities
 * @memberof Partup.schemas.forms
 */
Partup.schemas.forms.startActivities = new SimpleSchema([activityBaseSchema, {
    //
}]);

Partup.schemas.forms.activity = new SimpleSchema([activityBaseSchema]);
