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

// Everything related to Forest Authentication

export function ensureAuthenticated(request: Request, response: Response, next: NextFunction): void;
export interface User {
  renderingId: number;
}

// Everything related to Forest constants

export const PUBLIC_ROUTES: string[];

// Everything related to record manipulation

type RecordId = Types.ObjectId | string | number;

interface RecordsSerialized {
  data: Record<string, unknown>[],
  included: Record<string, unknown>[],
}

export class AbstractRecordTool<T> {
  constructor(model: Model<T>, user: User, query: Record<string, any>)
  serialize(records: Document<T> | Document<T>[]): Promise<RecordsSerialized>;
}

export class RecordGetter<T> extends AbstractRecordTool<T> {
  get(recordId: RecordId): Promise<T & Document>;
}

export class RecordsGetter<T> extends AbstractRecordTool<T> {
  getAll(query: Query): Promise<(T & Document)[]>;
  getIdsFromRequest(request: Request): Promise<string[]>;
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

export interface Filter {
  field: string;
  operator: string;
  value: string;
}

export enum Aggregator {
  AND = 'and',
  OR = 'or'
}

export interface AggregatedFilters {
  aggregator: Aggregator;
  conditions: Filter[];
}

export interface Query {
  timezone?: string;
  search?: string;
  fields?: {[key: string]: string};
  sort?: string;
  filters?: Filter|AggregatedFilters;
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
  (search: string): FilterQuery<any>;
}

export interface SmartFieldFiltererFilter {
  condition: FilterQuery<any>,
  where: Record<symbol, Record<symbol, any> | any>,
}

export interface SmartFieldFilterer {
  (filter: SmartFieldFiltererFilter): FilterQuery<any>;
}

export interface SegmentAggregationCreator<T = any> {
  (model: Model<T>): FilterQuery<any>;
}

type FieldType = 'Boolean' | 'Date' | 'Dateonly' | 'Enum' | 'File' | 'Number' | 'String' | ['Enum'] | ['Number'] | ['String'];

type FieldEnumsType = string[] | number[] | Date[] | boolean[];

export interface SmartFieldOptions {
  field: string;
  description?: string;
  type: FieldType;
  isFilterable?: boolean;
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

export interface SmartActionLoadHook<T = any> {
  (context: { fields: SmartActionLoadHookField[], record: T & Document }): SmartActionLoadHookField[]
}

export interface SmartActionChangeHookField extends SmartActionHookField {
  previousValue: any,
}

export interface SmartActionChangeHook<T = any> {
  (context: { fields: SmartActionChangeHookField[], record: T, changedField: SmartActionChangeHookField }): SmartActionChangeHookField[]
}

export interface SmartActionHooks {
  load: SmartActionLoadHook;
  change: Record<string, SmartActionChangeHook>;
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
  fields?: SmartFieldOptions[];
  actions?: SmartActionOptions[];
  segments?: SmartSegmentOptions[];
}

export function collection(name: string, options: CollectionOptions): void;

export function errorHandler(): RequestHandler;
