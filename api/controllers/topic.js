var auth = require("../helpers/auth");
var _ = require('lodash');
var defaultLog = require('winston').loggers.get('default');
var mongoose = require('mongoose');
var Actions = require('../helpers/actions');
var Utils = require('../helpers/utils');
var tagList = [
    'description',
    'name',
    'pillar',
    'parent',
];

var getSanitizedFields = function (fields) {
    return _.remove(fields, function (f) {
        return (_.indexOf(tagList, f) !== -1);
    });
}

exports.protectedOptions = function (args, res, rest) {
    res.status(200).send();
};

//  Create a new topic
exports.protectedPost = async function (args, res, next) {
    var obj = args.swagger.params.topic.value;

    defaultLog.info("Incoming new object:", obj);

    var Topic = mongoose.model('Topic');
    var topic = new Topic(obj);
    topic._schemaName = 'Topic';
    topic.read = ['project-system-admin']

    // Define security tag defaults
    var theTopic = await topic.save()
    return Actions.sendResponse(res, 200, theTopic);
};

exports.protectedGet = async function (args, res, next) {
    var query = {};
    if (args.swagger.params.topicId && args.swagger.params.topicId.value) {
        query = Utils.buildQuery("_id", args.swagger.params.topicId.value, query);
    }

    // Set query type
    _.assignIn(query, { "_schemaName": "Topic" });

    var data = await Utils.runDataQuery('Topic',
        args.swagger.params.auth_payload.realm_access.roles,
        query,
        getSanitizedFields(args.swagger.params.fields.value), // Fields
        null, // sort warmup
        null, // sort
        null, // skip
        null, // limit
        false) // count
    return Actions.sendResponse(res, 200, data);
};

exports.protectedPut = async function (args, res, next) {
    var objId = args.swagger.params.topicId.value;
    defaultLog.info("ObjectID:", args.swagger.params.topicId.value);
    var obj = args.swagger.params.cp.value;

    // Strip security tags - these will not be updated on this route.
    delete obj.tags;

    defaultLog.info("Incoming updated object:", obj);

    var commentperiod = require('mongoose').model('Topic');
    var data = await commentperiod.findOneAndUpdate({ _id: objId }, obj, { upsert: false, new: true }).exec();
    return Actions.sendResponse(res, 200, data);
}

exports.protectedDelete = async function (args, res, next) {
    var objId = args.swagger.params.topicId.value;
    defaultLog.info("Delete Topic:", objId);

    var commentperiod = require('mongoose').model('Topic');
    var data = await commentperiod.remove({ _id: objId }).exec();
    return Actions.sendResponse(res, 200, data);
};