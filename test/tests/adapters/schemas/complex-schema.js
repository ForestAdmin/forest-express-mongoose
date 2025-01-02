const mongoose = require('mongoose');

const { Schema } = mongoose;

const SurveyContentSchema = new Schema({
  content_id: { type: Schema.Types.ObjectId, required: true, ref: 'Content' },
  placebo: { type: Boolean, required: true, default: false },
  attentionCheck: {
    type: new Schema({
      questionFieldName: {
        type: String, required: true, minlength: 3, maxlength: 128,
      },
      acceptedAnswers: { type: [String], required: true, default: [] },
      question_id: {
        type: Schema.Types.ObjectId,
        required: false,
        ref: 'Question',
        default: undefined,
      },
    }, { sub: true }),
    required: false,
    default: null,
  },
  batchName: {
    type: String, required: false, minlength: 3, maxlength: 128,
  },
  batchNum: {
    type: Number, required: false, min: 1, max: 100,
  },
  rctConfig: {
    type: new Schema({
      responsesNeeded: {
        type: Number, required: true, min: 0, max: 10000000, default: 500,
      },
      useRandom: { type: Boolean, required: false, default: undefined },
    }, { sub: true }),
    required: true,
    default: { responsesNeeded: 500 },
  },
}, { sub: true, array: true });

const SurveyIndexSchema = new Schema({
  index_id: { type: Schema.Types.ObjectId, required: true, ref: 'Index' },
  directionDependency: { type: Schema.Types.ObjectId, required: false, ref: 'Index' },
}, { sub: true, array: true });

const SurveyQuestionSchema = new Schema({
  question_id: { type: Schema.Types.ObjectId, required: true, ref: 'Question' },
  sortOrder: {
    type: Number, required: false, min: 0, max: 100,
  },
}, { sub: true, array: true });

const SurveyExperimentFilterSchema = new Schema({
  category: {
    type: String, required: false, minlength: 3, maxlength: 128,
  },
  method: {
    type: String, required: false, enum: ['number', 'percentile', 'list'],
  },
  direction: { type: String, required: false, enum: ['gt', 'lt'] },
  limit: { type: Number, required: false },
  allowedValues: { type: [String], required: false },
}, { sub: true, array: true });

const SurveyExperimentSchema = new Schema({
  name: {
    type: String, required: true, minlength: 3, maxlength: 128,
  },
  sortOrder: { type: Number, required: false, min: 0 },
  index_id: { type: Schema.Types.ObjectId, required: true, ref: 'Index' },
  filters: {
    type: [SurveyExperimentFilterSchema], required: true, default: [],
  },
  counts: { type: Schema.Types.Mixed, required: false },
  results: { type: [Schema.Types.Mixed], required: false },
}, { sub: true, array: true });

const SurveyAcquisitionSchema = new Schema({
  mode: {
    type: String,
    required: true,
  },
  acquisitionConfig_id: {
    type: Schema.Types.ObjectId, required: false, ref: 'Acquisition',
  },
  HITTypeId: {
    type: String, required: false, minlength: 3, maxlength: 64,
  },
  uniqueWorkerQualificationTypeId: {
    type: String, required: false, minlength: 3, maxlength: 64,
  },
  completionCode: {
    type: String, required: false, minlength: 3, maxlength: 128,
  },
}, { sub: true, array: true });

const SurveyAnalysisConfigSchema = new Schema({
  attnCheck: { type: Boolean, required: true, default: true },
  poststratify: { type: Boolean, required: true, default: true },
  censusYear: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 128,
    default: 'est72016',
  },
  allowDuplicatesAcrossBatches: { type: Boolean, required: false },
  customSegments: { type: [String], required: false },
  politicalBins: { type: Schema.Types.Mixed, required: false },
}, { sub: true });

const DEFAULT_ANALYSIS_CONFIG = {
  attnCheck: true,
  poststratify: true,
};

const SurveyLocaleSchema = new Schema({
  country: {
    type: String, required: true, // enum: LOCALE_COUNTRIES, default: 'US',
  },
  state: {
    type: new Schema({
      included: { type: [String], required: false },
      excluded: { type: [String], required: false },
    }, { sub: true }),
    required: false,
  },
  settings: {
    type: new Schema({
      politicalSpectrum: { type: [String], required: false },
    }, { sub: true }),
    required: false,
  },
}, { sub: true });

const DEFAULT_LOCALE = { country: 'US' };

const SurveyAnalysisMetaSchema = new Schema({
  branch: { type: String, required: true },
  commit: { type: String, required: true },
  timestamp: { type: Date, required: true },
}, { sub: true });

const SurveySchema = new Schema({
  name: { type: String, required: true },

  introText: { type: String, required: true },
  outroText: { type: String, required: false },

  pretest: { type: Boolean, required: true, default: false },
  closeAt: { type: Date, required: true, default: Date.now },
  launchAt: { type: Date, required: true, default: Date.now },

  questions: { type: [SurveyQuestionSchema], required: true, default: [] },
  content: { type: [SurveyContentSchema], required: true, default: [] },

  indices: { type: [SurveyIndexSchema], required: true, default: [] },
  experiments: { type: [SurveyExperimentSchema], required: true, default: [] },

  acquisition: { type: [SurveyAcquisitionSchema], required: true, default: [] },

  analysisConfig: {
    type: SurveyAnalysisConfigSchema,
    required: true,
    default: DEFAULT_ANALYSIS_CONFIG,
  },

  locale: { type: SurveyLocaleSchema, required: true, default: DEFAULT_LOCALE },

  analysisMeta: { type: SurveyAnalysisMetaSchema, required: false },
}, {
  collection: 'surveys',
});

SurveySchema.methods.duplicationErrors = () => {};

module.exports = mongoose.model('Survey', SurveySchema);
