import { Application, NextFunction, Request, RequestHandler, Response } from 'express';
import {
  ConnectionOptions,
  Mongoose,
  Connection,
  Model,
  Types,
  Document,
  FilterQuery,
} from "mongoose";

// Everything related to Forest initialization

export interface LianaOptions {
  objectMapping: Mongoose;
  envSecret: string;
  authSecret: string;
  connections: Record<string, Connection>;
  includedModels?: string[];
  excludedModels?: string[];
  configDir?: string;
  schemaDir?: string;
}

export function init(options: LianaOptions): Promise<Application>;

export interface DatabaseConfiguration {
  name: string,
  modelsDir: string,
  connection: {
    url: string,
    options: ConnectionOptions,
  }
}

export interface ForestRequest extends Request {
  user: User,
}

// Base attributes for actions requests (content of request.data.body.attributes)
interface ActionRequestAttributes {
  collection_name: string,
  ids: string[],
  parent_collection_name: string,
  parent_collection_id: string,
  parent_association_name: string,
  all_records: boolean,
  all_records_subset_query: Query,
  all_records_ids_excluded: string[],
  smart_action_id: string,
}

// Base body from requests for action routes / hooks
interface ActionRequestBody {
  data: {
    attributes: ActionRequestAttributes,
    type: 'action-requests',
  },
}

// Base body from requests for classic smart action routes
interface SmartActionRequestBody<T extends Record<string, any> = Record<string, any>> {
  data: {
    attributes: ActionRequestAttributes & { values: T },
    type: 'custom-action-requests',
  },
}

// Base body from requests for smart action hooks
interface SmartActionHookRequestBody {
  data: {
    attributes: ActionRequestAttributes & {
      fields: SmartActionChangeHookField[],
      changedField: string,
    },
    type: 'custom-action-hook-requests',
  },
}

// Concrete smart action request for classic smart action routes
export interface SmartActionRequest<T extends Record<string, any> = Record<string, any>> extends ForestRequest {
  body: SmartActionRequestBody<T>,
}

// Request passed to smart action load hooks
export interface SmartActionLoadHookRequest extends ForestRequest {
  body: ActionRequestBody,
}

// Request passed to smart action change hooks
export interface SmartActionChangeHookRequest extends ForestRequest {
  body: SmartActionHookRequestBody,
}

// Everything related to Forest Authentication

export function ensureAuthenticated(request: Request, response: Response, next: NextFunction): void;

export interface UserTag {
  key: string,
  value: string,
}

export interface User {
  email: string,
  firstName: string,
  lastName: string,
  team: string,
  role: string,
  tags: UserTag[],
  renderingId: number;
  iat: number,
  exp: number,
}

// Everything related to Forest constants

export const PUBLIC_ROUTES: string[];

// Everything related to record manipulation

type RecordId = Types.ObjectId | string | number;

interface RecordsSerialized {
  data: Record<string, unknown>[],
  included: Record<string, unknown>[],
}

interface Meta {
  count: number,
  [k: string]: any,
}

export class AbstractRecordTool<T> {
  constructor(model: Model<T>, user: User, query: Record<string, any>)
  serialize(records: Document<T> | Document<T>[], meta?: Meta): Promise<RecordsSerialized>;
}

export class RecordGetter<T> extends AbstractRecordTool<T> {
  get(recordId: RecordId): Promise<T & Document>;
}

export class RecordsGetter<T> extends AbstractRecordTool<T> {
  getAll(queryExtra?: Query): Promise<(T & Document)[]>;
  getIdsFromRequest(request: SmartActionRequest | SmartActionLoadHookRequest | SmartActionChangeHookRequest): Promise<string[]>;
}

export class RecordsCounter<M extends Model<any>> extends AbstractRecordTool<M> {
  count(): Promise<number>;
}

export class RecordsExporter<M extends Model<any>> extends AbstractRecordTool<M> {
  streamExport(response: Response): Promise<void>;
}

export class RecordUpdater<M extends Model<any>> extends AbstractRecordTool<M> {
  deserialize(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  update(record: Record<string, unknown>, recordId: RecordId): Promise<M>;
}

export class RecordCreator<M extends Model<any>> extends AbstractRecordTool<M> {
  deserialize(body: Record<string, unknown>): Promise<Record<string, unknown>>;
  create(record: Record<string, unknown>): Promise<M>;
}

export class RecordRemover<M extends Model<any>> extends AbstractRecordTool<M> {
  remove(recordId: RecordId): Promise<void>;
}

export class RecordsRemover<M extends Model<any>> extends AbstractRecordTool<M> {
  remove(recordIds: RecordId[]): Promise<void>;
}

export class RecordSerializer<T> {
  constructor(model: { name: string } | Model<T>, user?: User, query?: Query);
  serialize(records: Record<string, any> | Record<string, any>[], meta?: Meta): Promise<RecordsSerialized>;
}

// Optional middleware(s) related to the perf

export function deactivateCountMiddleware(request: Request, response: Response, next: NextFunction): void;


// Everything related to Forest permissions

export class PermissionMiddlewareCreator {
  constructor(collectionName: string)
  list(): RequestHandler;
  export(): RequestHandler;
  details(): RequestHandler;
  create(): RequestHandler;
  update(): RequestHandler;
  delete(): RequestHandler;
  smartAction(): RequestHandler;
}

// Everything related to Forest Charts

export interface StatSerialized {
  data: {
    type: string,
    id: string,
    attributes: {
      value: any[]
    }
  };
}

export class StatSerializer {
  constructor(stats: { value: any[] })
  perform(): StatSerialized;
}

// Everything related to Forest request params

export interface Page {
  number: number;
  size: number;
}

export type FilterOperator = 
  // Classic
  | "not" | "greater_than" | "less_than" | "after" | "before" | "contains"
  | "starts_with" | "ends_with" | "not_contains" | "present" | "blank"
  | "not_equal" | "equal" | "includes_all" | "in"

  // Date
  | "today" | "yesterday" | "previous_week" | "previous_month" | "previous_quater"
  | "previous_year" | "previous_week_to_date" | "previous_month_to_date"
  | "previous_quarter_to_date" | "previous_year_to_date" | "previous_x_days"
  | "previous_x_days_to_date" | "past" | "future" | "before_x_hours_ago" | "after_x_hours_ago" ;

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface Query {
  timezone?: string;
  search?: string;
  fields?: {[key: string]: string};
  sort?: string;
  filters?: string;
  page?: Page;
  searchExtended?: string;
}

// Everything related to Forest collection configuration

export interface SmartFieldValueGetter<T = any> {
  (record: T & Document): any;
}

export interface SmartFieldValueSetter<T = any> {
  (record: T & Document, fieldValue: any): any;
}

export interface SmartFieldSearcher {
  (search: string): FilterQuery<any> | Promise<FilterQuery<any>>;
}

export interface SmartFieldFiltererFilter {
  condition: FilterQuery<any>,
  where: Record<symbol, Record<symbol, any> | any>,
}

export interface SmartFieldFilterer {
  (filter: SmartFieldFiltererFilter): FilterQuery<any> | Promise<FilterQuery<any>>;
}

export interface SegmentAggregationCreator<T = any> {
  (model: Model<T>): FilterQuery<any>;
}

type FieldType = 'Boolean' | 'Date' | 'Dateonly' | 'Enum' | 'File' | 'Number' | 'String' | 'Json' | ['Enum'] | ['Number'] | ['String'];

type FieldEnumsType = string[] | number[] | Date[] | boolean[];

export interface SmartFieldOptions {
  field: string;
  description?: string;
  type: FieldType;
  isFilterable?: boolean;
  isSortable?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  reference?: string;
  enums?: FieldEnumsType;
  defaultValue?: any;
  get?: SmartFieldValueGetter;
  set?: SmartFieldValueSetter;
  search?: SmartFieldSearcher;
  filter?: SmartFieldFilterer;
}

export interface SmartActionField {
  field: string,
  description?: string,
  type: FieldType,
  isRequired?: boolean,
  isReadOnly?: boolean,
  enums?: FieldEnumsType,
  defaultValue?: any,
  reference?: string,
  hook?: string,
}

export interface SmartActionHookField extends SmartActionField {
  value: any,
}

export interface SmartActionLoadHookField extends SmartActionHookField {
  position: number,
}

export interface SmartActionLoadHook {
  (context: { fields: SmartActionLoadHookField[], request: SmartActionLoadHookRequest }): SmartActionLoadHookField[] | Promise<SmartActionLoadHookField[]>
}

export interface SmartActionChangeHookField extends SmartActionHookField {
  previousValue: any,
}

export interface SmartActionChangeHook {
  (context: { fields: SmartActionChangeHookField[], changedField: SmartActionChangeHookField, request: SmartActionChangeHookRequest }): SmartActionChangeHookField[] | Promise<SmartActionChangeHookField[]>
}

export interface SmartActionHooks {
  load?: SmartActionLoadHook;
  change?: Record<string, SmartActionChangeHook>;
}

export interface SmartActionOptions {
  name: string;
  type?: 'global' | 'bulk' | 'single';
  fields?: SmartActionField[];
  download?: boolean;
  endpoint?: string;
  httpMethod?: string;
  hooks?: SmartActionHooks;
}

export interface SmartSegmentOptions {
  name: string;
  where: SegmentAggregationCreator;
}

export interface CollectionOptions {
  isSearchable?: boolean;
  fields?: SmartFieldOptions[];
  actions?: SmartActionOptions[];
  segments?: SmartSegmentOptions[];
  searchFields?: string[];
  fieldsToFlatten?: ({ field: string, level?: number } | string)[]
}

export function collection(name: string, options: CollectionOptions): void;

export function errorHandler(): RequestHandler;

export function requestUnflattener(): RequestHandler;
