
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model CommunityThread
 * 
 */
export type CommunityThread = $Result.DefaultSelection<Prisma.$CommunityThreadPayload>
/**
 * Model CommunityReply
 * 
 */
export type CommunityReply = $Result.DefaultSelection<Prisma.$CommunityReplyPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more CommunityThreads
 * const communityThreads = await prisma.communityThread.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more CommunityThreads
   * const communityThreads = await prisma.communityThread.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.communityThread`: Exposes CRUD operations for the **CommunityThread** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CommunityThreads
    * const communityThreads = await prisma.communityThread.findMany()
    * ```
    */
  get communityThread(): Prisma.CommunityThreadDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.communityReply`: Exposes CRUD operations for the **CommunityReply** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CommunityReplies
    * const communityReplies = await prisma.communityReply.findMany()
    * ```
    */
  get communityReply(): Prisma.CommunityReplyDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.4.2
   * Query Engine version: 94a226be1cf2967af2541cca5529f0f7ba866919
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    CommunityThread: 'CommunityThread',
    CommunityReply: 'CommunityReply'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "communityThread" | "communityReply"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      CommunityThread: {
        payload: Prisma.$CommunityThreadPayload<ExtArgs>
        fields: Prisma.CommunityThreadFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CommunityThreadFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CommunityThreadFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>
          }
          findFirst: {
            args: Prisma.CommunityThreadFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CommunityThreadFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>
          }
          findMany: {
            args: Prisma.CommunityThreadFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>[]
          }
          create: {
            args: Prisma.CommunityThreadCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>
          }
          createMany: {
            args: Prisma.CommunityThreadCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CommunityThreadCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>[]
          }
          delete: {
            args: Prisma.CommunityThreadDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>
          }
          update: {
            args: Prisma.CommunityThreadUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>
          }
          deleteMany: {
            args: Prisma.CommunityThreadDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CommunityThreadUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CommunityThreadUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>[]
          }
          upsert: {
            args: Prisma.CommunityThreadUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityThreadPayload>
          }
          aggregate: {
            args: Prisma.CommunityThreadAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCommunityThread>
          }
          groupBy: {
            args: Prisma.CommunityThreadGroupByArgs<ExtArgs>
            result: $Utils.Optional<CommunityThreadGroupByOutputType>[]
          }
          count: {
            args: Prisma.CommunityThreadCountArgs<ExtArgs>
            result: $Utils.Optional<CommunityThreadCountAggregateOutputType> | number
          }
        }
      }
      CommunityReply: {
        payload: Prisma.$CommunityReplyPayload<ExtArgs>
        fields: Prisma.CommunityReplyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CommunityReplyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CommunityReplyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>
          }
          findFirst: {
            args: Prisma.CommunityReplyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CommunityReplyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>
          }
          findMany: {
            args: Prisma.CommunityReplyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>[]
          }
          create: {
            args: Prisma.CommunityReplyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>
          }
          createMany: {
            args: Prisma.CommunityReplyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CommunityReplyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>[]
          }
          delete: {
            args: Prisma.CommunityReplyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>
          }
          update: {
            args: Prisma.CommunityReplyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>
          }
          deleteMany: {
            args: Prisma.CommunityReplyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CommunityReplyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CommunityReplyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>[]
          }
          upsert: {
            args: Prisma.CommunityReplyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CommunityReplyPayload>
          }
          aggregate: {
            args: Prisma.CommunityReplyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCommunityReply>
          }
          groupBy: {
            args: Prisma.CommunityReplyGroupByArgs<ExtArgs>
            result: $Utils.Optional<CommunityReplyGroupByOutputType>[]
          }
          count: {
            args: Prisma.CommunityReplyCountArgs<ExtArgs>
            result: $Utils.Optional<CommunityReplyCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    communityThread?: CommunityThreadOmit
    communityReply?: CommunityReplyOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type CommunityThreadCountOutputType
   */

  export type CommunityThreadCountOutputType = {
    replies: number
  }

  export type CommunityThreadCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    replies?: boolean | CommunityThreadCountOutputTypeCountRepliesArgs
  }

  // Custom InputTypes
  /**
   * CommunityThreadCountOutputType without action
   */
  export type CommunityThreadCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThreadCountOutputType
     */
    select?: CommunityThreadCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CommunityThreadCountOutputType without action
   */
  export type CommunityThreadCountOutputTypeCountRepliesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommunityReplyWhereInput
  }


  /**
   * Models
   */

  /**
   * Model CommunityThread
   */

  export type AggregateCommunityThread = {
    _count: CommunityThreadCountAggregateOutputType | null
    _avg: CommunityThreadAvgAggregateOutputType | null
    _sum: CommunityThreadSumAggregateOutputType | null
    _min: CommunityThreadMinAggregateOutputType | null
    _max: CommunityThreadMaxAggregateOutputType | null
  }

  export type CommunityThreadAvgAggregateOutputType = {
    id: number | null
  }

  export type CommunityThreadSumAggregateOutputType = {
    id: bigint | null
  }

  export type CommunityThreadMinAggregateOutputType = {
    id: bigint | null
    type: string | null
    title: string | null
    body: string | null
    authorName: string | null
    walletAddress: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CommunityThreadMaxAggregateOutputType = {
    id: bigint | null
    type: string | null
    title: string | null
    body: string | null
    authorName: string | null
    walletAddress: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CommunityThreadCountAggregateOutputType = {
    id: number
    type: number
    title: number
    body: number
    authorName: number
    walletAddress: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CommunityThreadAvgAggregateInputType = {
    id?: true
  }

  export type CommunityThreadSumAggregateInputType = {
    id?: true
  }

  export type CommunityThreadMinAggregateInputType = {
    id?: true
    type?: true
    title?: true
    body?: true
    authorName?: true
    walletAddress?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CommunityThreadMaxAggregateInputType = {
    id?: true
    type?: true
    title?: true
    body?: true
    authorName?: true
    walletAddress?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CommunityThreadCountAggregateInputType = {
    id?: true
    type?: true
    title?: true
    body?: true
    authorName?: true
    walletAddress?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CommunityThreadAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CommunityThread to aggregate.
     */
    where?: CommunityThreadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommunityThreads to fetch.
     */
    orderBy?: CommunityThreadOrderByWithRelationInput | CommunityThreadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CommunityThreadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommunityThreads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommunityThreads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CommunityThreads
    **/
    _count?: true | CommunityThreadCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CommunityThreadAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CommunityThreadSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CommunityThreadMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CommunityThreadMaxAggregateInputType
  }

  export type GetCommunityThreadAggregateType<T extends CommunityThreadAggregateArgs> = {
        [P in keyof T & keyof AggregateCommunityThread]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCommunityThread[P]>
      : GetScalarType<T[P], AggregateCommunityThread[P]>
  }




  export type CommunityThreadGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommunityThreadWhereInput
    orderBy?: CommunityThreadOrderByWithAggregationInput | CommunityThreadOrderByWithAggregationInput[]
    by: CommunityThreadScalarFieldEnum[] | CommunityThreadScalarFieldEnum
    having?: CommunityThreadScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CommunityThreadCountAggregateInputType | true
    _avg?: CommunityThreadAvgAggregateInputType
    _sum?: CommunityThreadSumAggregateInputType
    _min?: CommunityThreadMinAggregateInputType
    _max?: CommunityThreadMaxAggregateInputType
  }

  export type CommunityThreadGroupByOutputType = {
    id: bigint
    type: string
    title: string
    body: string
    authorName: string
    walletAddress: string | null
    createdAt: Date
    updatedAt: Date
    _count: CommunityThreadCountAggregateOutputType | null
    _avg: CommunityThreadAvgAggregateOutputType | null
    _sum: CommunityThreadSumAggregateOutputType | null
    _min: CommunityThreadMinAggregateOutputType | null
    _max: CommunityThreadMaxAggregateOutputType | null
  }

  type GetCommunityThreadGroupByPayload<T extends CommunityThreadGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CommunityThreadGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CommunityThreadGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CommunityThreadGroupByOutputType[P]>
            : GetScalarType<T[P], CommunityThreadGroupByOutputType[P]>
        }
      >
    >


  export type CommunityThreadSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    title?: boolean
    body?: boolean
    authorName?: boolean
    walletAddress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    replies?: boolean | CommunityThread$repliesArgs<ExtArgs>
    _count?: boolean | CommunityThreadCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["communityThread"]>

  export type CommunityThreadSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    title?: boolean
    body?: boolean
    authorName?: boolean
    walletAddress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["communityThread"]>

  export type CommunityThreadSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    title?: boolean
    body?: boolean
    authorName?: boolean
    walletAddress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["communityThread"]>

  export type CommunityThreadSelectScalar = {
    id?: boolean
    type?: boolean
    title?: boolean
    body?: boolean
    authorName?: boolean
    walletAddress?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CommunityThreadOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "title" | "body" | "authorName" | "walletAddress" | "createdAt" | "updatedAt", ExtArgs["result"]["communityThread"]>
  export type CommunityThreadInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    replies?: boolean | CommunityThread$repliesArgs<ExtArgs>
    _count?: boolean | CommunityThreadCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CommunityThreadIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type CommunityThreadIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $CommunityThreadPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CommunityThread"
    objects: {
      replies: Prisma.$CommunityReplyPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      type: string
      title: string
      body: string
      authorName: string
      walletAddress: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["communityThread"]>
    composites: {}
  }

  type CommunityThreadGetPayload<S extends boolean | null | undefined | CommunityThreadDefaultArgs> = $Result.GetResult<Prisma.$CommunityThreadPayload, S>

  type CommunityThreadCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CommunityThreadFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CommunityThreadCountAggregateInputType | true
    }

  export interface CommunityThreadDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CommunityThread'], meta: { name: 'CommunityThread' } }
    /**
     * Find zero or one CommunityThread that matches the filter.
     * @param {CommunityThreadFindUniqueArgs} args - Arguments to find a CommunityThread
     * @example
     * // Get one CommunityThread
     * const communityThread = await prisma.communityThread.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CommunityThreadFindUniqueArgs>(args: SelectSubset<T, CommunityThreadFindUniqueArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CommunityThread that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CommunityThreadFindUniqueOrThrowArgs} args - Arguments to find a CommunityThread
     * @example
     * // Get one CommunityThread
     * const communityThread = await prisma.communityThread.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CommunityThreadFindUniqueOrThrowArgs>(args: SelectSubset<T, CommunityThreadFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CommunityThread that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityThreadFindFirstArgs} args - Arguments to find a CommunityThread
     * @example
     * // Get one CommunityThread
     * const communityThread = await prisma.communityThread.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CommunityThreadFindFirstArgs>(args?: SelectSubset<T, CommunityThreadFindFirstArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CommunityThread that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityThreadFindFirstOrThrowArgs} args - Arguments to find a CommunityThread
     * @example
     * // Get one CommunityThread
     * const communityThread = await prisma.communityThread.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CommunityThreadFindFirstOrThrowArgs>(args?: SelectSubset<T, CommunityThreadFindFirstOrThrowArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CommunityThreads that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityThreadFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CommunityThreads
     * const communityThreads = await prisma.communityThread.findMany()
     * 
     * // Get first 10 CommunityThreads
     * const communityThreads = await prisma.communityThread.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const communityThreadWithIdOnly = await prisma.communityThread.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CommunityThreadFindManyArgs>(args?: SelectSubset<T, CommunityThreadFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CommunityThread.
     * @param {CommunityThreadCreateArgs} args - Arguments to create a CommunityThread.
     * @example
     * // Create one CommunityThread
     * const CommunityThread = await prisma.communityThread.create({
     *   data: {
     *     // ... data to create a CommunityThread
     *   }
     * })
     * 
     */
    create<T extends CommunityThreadCreateArgs>(args: SelectSubset<T, CommunityThreadCreateArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CommunityThreads.
     * @param {CommunityThreadCreateManyArgs} args - Arguments to create many CommunityThreads.
     * @example
     * // Create many CommunityThreads
     * const communityThread = await prisma.communityThread.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CommunityThreadCreateManyArgs>(args?: SelectSubset<T, CommunityThreadCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CommunityThreads and returns the data saved in the database.
     * @param {CommunityThreadCreateManyAndReturnArgs} args - Arguments to create many CommunityThreads.
     * @example
     * // Create many CommunityThreads
     * const communityThread = await prisma.communityThread.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CommunityThreads and only return the `id`
     * const communityThreadWithIdOnly = await prisma.communityThread.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CommunityThreadCreateManyAndReturnArgs>(args?: SelectSubset<T, CommunityThreadCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CommunityThread.
     * @param {CommunityThreadDeleteArgs} args - Arguments to delete one CommunityThread.
     * @example
     * // Delete one CommunityThread
     * const CommunityThread = await prisma.communityThread.delete({
     *   where: {
     *     // ... filter to delete one CommunityThread
     *   }
     * })
     * 
     */
    delete<T extends CommunityThreadDeleteArgs>(args: SelectSubset<T, CommunityThreadDeleteArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CommunityThread.
     * @param {CommunityThreadUpdateArgs} args - Arguments to update one CommunityThread.
     * @example
     * // Update one CommunityThread
     * const communityThread = await prisma.communityThread.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CommunityThreadUpdateArgs>(args: SelectSubset<T, CommunityThreadUpdateArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CommunityThreads.
     * @param {CommunityThreadDeleteManyArgs} args - Arguments to filter CommunityThreads to delete.
     * @example
     * // Delete a few CommunityThreads
     * const { count } = await prisma.communityThread.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CommunityThreadDeleteManyArgs>(args?: SelectSubset<T, CommunityThreadDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CommunityThreads.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityThreadUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CommunityThreads
     * const communityThread = await prisma.communityThread.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CommunityThreadUpdateManyArgs>(args: SelectSubset<T, CommunityThreadUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CommunityThreads and returns the data updated in the database.
     * @param {CommunityThreadUpdateManyAndReturnArgs} args - Arguments to update many CommunityThreads.
     * @example
     * // Update many CommunityThreads
     * const communityThread = await prisma.communityThread.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CommunityThreads and only return the `id`
     * const communityThreadWithIdOnly = await prisma.communityThread.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CommunityThreadUpdateManyAndReturnArgs>(args: SelectSubset<T, CommunityThreadUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CommunityThread.
     * @param {CommunityThreadUpsertArgs} args - Arguments to update or create a CommunityThread.
     * @example
     * // Update or create a CommunityThread
     * const communityThread = await prisma.communityThread.upsert({
     *   create: {
     *     // ... data to create a CommunityThread
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CommunityThread we want to update
     *   }
     * })
     */
    upsert<T extends CommunityThreadUpsertArgs>(args: SelectSubset<T, CommunityThreadUpsertArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CommunityThreads.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityThreadCountArgs} args - Arguments to filter CommunityThreads to count.
     * @example
     * // Count the number of CommunityThreads
     * const count = await prisma.communityThread.count({
     *   where: {
     *     // ... the filter for the CommunityThreads we want to count
     *   }
     * })
    **/
    count<T extends CommunityThreadCountArgs>(
      args?: Subset<T, CommunityThreadCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CommunityThreadCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CommunityThread.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityThreadAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CommunityThreadAggregateArgs>(args: Subset<T, CommunityThreadAggregateArgs>): Prisma.PrismaPromise<GetCommunityThreadAggregateType<T>>

    /**
     * Group by CommunityThread.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityThreadGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CommunityThreadGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CommunityThreadGroupByArgs['orderBy'] }
        : { orderBy?: CommunityThreadGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CommunityThreadGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCommunityThreadGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CommunityThread model
   */
  readonly fields: CommunityThreadFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CommunityThread.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CommunityThreadClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    replies<T extends CommunityThread$repliesArgs<ExtArgs> = {}>(args?: Subset<T, CommunityThread$repliesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CommunityThread model
   */
  interface CommunityThreadFieldRefs {
    readonly id: FieldRef<"CommunityThread", 'BigInt'>
    readonly type: FieldRef<"CommunityThread", 'String'>
    readonly title: FieldRef<"CommunityThread", 'String'>
    readonly body: FieldRef<"CommunityThread", 'String'>
    readonly authorName: FieldRef<"CommunityThread", 'String'>
    readonly walletAddress: FieldRef<"CommunityThread", 'String'>
    readonly createdAt: FieldRef<"CommunityThread", 'DateTime'>
    readonly updatedAt: FieldRef<"CommunityThread", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CommunityThread findUnique
   */
  export type CommunityThreadFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * Filter, which CommunityThread to fetch.
     */
    where: CommunityThreadWhereUniqueInput
  }

  /**
   * CommunityThread findUniqueOrThrow
   */
  export type CommunityThreadFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * Filter, which CommunityThread to fetch.
     */
    where: CommunityThreadWhereUniqueInput
  }

  /**
   * CommunityThread findFirst
   */
  export type CommunityThreadFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * Filter, which CommunityThread to fetch.
     */
    where?: CommunityThreadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommunityThreads to fetch.
     */
    orderBy?: CommunityThreadOrderByWithRelationInput | CommunityThreadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CommunityThreads.
     */
    cursor?: CommunityThreadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommunityThreads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommunityThreads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CommunityThreads.
     */
    distinct?: CommunityThreadScalarFieldEnum | CommunityThreadScalarFieldEnum[]
  }

  /**
   * CommunityThread findFirstOrThrow
   */
  export type CommunityThreadFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * Filter, which CommunityThread to fetch.
     */
    where?: CommunityThreadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommunityThreads to fetch.
     */
    orderBy?: CommunityThreadOrderByWithRelationInput | CommunityThreadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CommunityThreads.
     */
    cursor?: CommunityThreadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommunityThreads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommunityThreads.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CommunityThreads.
     */
    distinct?: CommunityThreadScalarFieldEnum | CommunityThreadScalarFieldEnum[]
  }

  /**
   * CommunityThread findMany
   */
  export type CommunityThreadFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * Filter, which CommunityThreads to fetch.
     */
    where?: CommunityThreadWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommunityThreads to fetch.
     */
    orderBy?: CommunityThreadOrderByWithRelationInput | CommunityThreadOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CommunityThreads.
     */
    cursor?: CommunityThreadWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommunityThreads from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommunityThreads.
     */
    skip?: number
    distinct?: CommunityThreadScalarFieldEnum | CommunityThreadScalarFieldEnum[]
  }

  /**
   * CommunityThread create
   */
  export type CommunityThreadCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * The data needed to create a CommunityThread.
     */
    data: XOR<CommunityThreadCreateInput, CommunityThreadUncheckedCreateInput>
  }

  /**
   * CommunityThread createMany
   */
  export type CommunityThreadCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CommunityThreads.
     */
    data: CommunityThreadCreateManyInput | CommunityThreadCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CommunityThread createManyAndReturn
   */
  export type CommunityThreadCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * The data used to create many CommunityThreads.
     */
    data: CommunityThreadCreateManyInput | CommunityThreadCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CommunityThread update
   */
  export type CommunityThreadUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * The data needed to update a CommunityThread.
     */
    data: XOR<CommunityThreadUpdateInput, CommunityThreadUncheckedUpdateInput>
    /**
     * Choose, which CommunityThread to update.
     */
    where: CommunityThreadWhereUniqueInput
  }

  /**
   * CommunityThread updateMany
   */
  export type CommunityThreadUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CommunityThreads.
     */
    data: XOR<CommunityThreadUpdateManyMutationInput, CommunityThreadUncheckedUpdateManyInput>
    /**
     * Filter which CommunityThreads to update
     */
    where?: CommunityThreadWhereInput
    /**
     * Limit how many CommunityThreads to update.
     */
    limit?: number
  }

  /**
   * CommunityThread updateManyAndReturn
   */
  export type CommunityThreadUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * The data used to update CommunityThreads.
     */
    data: XOR<CommunityThreadUpdateManyMutationInput, CommunityThreadUncheckedUpdateManyInput>
    /**
     * Filter which CommunityThreads to update
     */
    where?: CommunityThreadWhereInput
    /**
     * Limit how many CommunityThreads to update.
     */
    limit?: number
  }

  /**
   * CommunityThread upsert
   */
  export type CommunityThreadUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * The filter to search for the CommunityThread to update in case it exists.
     */
    where: CommunityThreadWhereUniqueInput
    /**
     * In case the CommunityThread found by the `where` argument doesn't exist, create a new CommunityThread with this data.
     */
    create: XOR<CommunityThreadCreateInput, CommunityThreadUncheckedCreateInput>
    /**
     * In case the CommunityThread was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CommunityThreadUpdateInput, CommunityThreadUncheckedUpdateInput>
  }

  /**
   * CommunityThread delete
   */
  export type CommunityThreadDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
    /**
     * Filter which CommunityThread to delete.
     */
    where: CommunityThreadWhereUniqueInput
  }

  /**
   * CommunityThread deleteMany
   */
  export type CommunityThreadDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CommunityThreads to delete
     */
    where?: CommunityThreadWhereInput
    /**
     * Limit how many CommunityThreads to delete.
     */
    limit?: number
  }

  /**
   * CommunityThread.replies
   */
  export type CommunityThread$repliesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    where?: CommunityReplyWhereInput
    orderBy?: CommunityReplyOrderByWithRelationInput | CommunityReplyOrderByWithRelationInput[]
    cursor?: CommunityReplyWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CommunityReplyScalarFieldEnum | CommunityReplyScalarFieldEnum[]
  }

  /**
   * CommunityThread without action
   */
  export type CommunityThreadDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityThread
     */
    select?: CommunityThreadSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityThread
     */
    omit?: CommunityThreadOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityThreadInclude<ExtArgs> | null
  }


  /**
   * Model CommunityReply
   */

  export type AggregateCommunityReply = {
    _count: CommunityReplyCountAggregateOutputType | null
    _avg: CommunityReplyAvgAggregateOutputType | null
    _sum: CommunityReplySumAggregateOutputType | null
    _min: CommunityReplyMinAggregateOutputType | null
    _max: CommunityReplyMaxAggregateOutputType | null
  }

  export type CommunityReplyAvgAggregateOutputType = {
    id: number | null
    threadId: number | null
  }

  export type CommunityReplySumAggregateOutputType = {
    id: bigint | null
    threadId: bigint | null
  }

  export type CommunityReplyMinAggregateOutputType = {
    id: bigint | null
    threadId: bigint | null
    body: string | null
    authorName: string | null
    walletAddress: string | null
    isAccepted: boolean | null
    createdAt: Date | null
  }

  export type CommunityReplyMaxAggregateOutputType = {
    id: bigint | null
    threadId: bigint | null
    body: string | null
    authorName: string | null
    walletAddress: string | null
    isAccepted: boolean | null
    createdAt: Date | null
  }

  export type CommunityReplyCountAggregateOutputType = {
    id: number
    threadId: number
    body: number
    authorName: number
    walletAddress: number
    isAccepted: number
    createdAt: number
    _all: number
  }


  export type CommunityReplyAvgAggregateInputType = {
    id?: true
    threadId?: true
  }

  export type CommunityReplySumAggregateInputType = {
    id?: true
    threadId?: true
  }

  export type CommunityReplyMinAggregateInputType = {
    id?: true
    threadId?: true
    body?: true
    authorName?: true
    walletAddress?: true
    isAccepted?: true
    createdAt?: true
  }

  export type CommunityReplyMaxAggregateInputType = {
    id?: true
    threadId?: true
    body?: true
    authorName?: true
    walletAddress?: true
    isAccepted?: true
    createdAt?: true
  }

  export type CommunityReplyCountAggregateInputType = {
    id?: true
    threadId?: true
    body?: true
    authorName?: true
    walletAddress?: true
    isAccepted?: true
    createdAt?: true
    _all?: true
  }

  export type CommunityReplyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CommunityReply to aggregate.
     */
    where?: CommunityReplyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommunityReplies to fetch.
     */
    orderBy?: CommunityReplyOrderByWithRelationInput | CommunityReplyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CommunityReplyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommunityReplies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommunityReplies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CommunityReplies
    **/
    _count?: true | CommunityReplyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CommunityReplyAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CommunityReplySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CommunityReplyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CommunityReplyMaxAggregateInputType
  }

  export type GetCommunityReplyAggregateType<T extends CommunityReplyAggregateArgs> = {
        [P in keyof T & keyof AggregateCommunityReply]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCommunityReply[P]>
      : GetScalarType<T[P], AggregateCommunityReply[P]>
  }




  export type CommunityReplyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CommunityReplyWhereInput
    orderBy?: CommunityReplyOrderByWithAggregationInput | CommunityReplyOrderByWithAggregationInput[]
    by: CommunityReplyScalarFieldEnum[] | CommunityReplyScalarFieldEnum
    having?: CommunityReplyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CommunityReplyCountAggregateInputType | true
    _avg?: CommunityReplyAvgAggregateInputType
    _sum?: CommunityReplySumAggregateInputType
    _min?: CommunityReplyMinAggregateInputType
    _max?: CommunityReplyMaxAggregateInputType
  }

  export type CommunityReplyGroupByOutputType = {
    id: bigint
    threadId: bigint
    body: string
    authorName: string
    walletAddress: string | null
    isAccepted: boolean
    createdAt: Date
    _count: CommunityReplyCountAggregateOutputType | null
    _avg: CommunityReplyAvgAggregateOutputType | null
    _sum: CommunityReplySumAggregateOutputType | null
    _min: CommunityReplyMinAggregateOutputType | null
    _max: CommunityReplyMaxAggregateOutputType | null
  }

  type GetCommunityReplyGroupByPayload<T extends CommunityReplyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CommunityReplyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CommunityReplyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CommunityReplyGroupByOutputType[P]>
            : GetScalarType<T[P], CommunityReplyGroupByOutputType[P]>
        }
      >
    >


  export type CommunityReplySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    threadId?: boolean
    body?: boolean
    authorName?: boolean
    walletAddress?: boolean
    isAccepted?: boolean
    createdAt?: boolean
    thread?: boolean | CommunityThreadDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["communityReply"]>

  export type CommunityReplySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    threadId?: boolean
    body?: boolean
    authorName?: boolean
    walletAddress?: boolean
    isAccepted?: boolean
    createdAt?: boolean
    thread?: boolean | CommunityThreadDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["communityReply"]>

  export type CommunityReplySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    threadId?: boolean
    body?: boolean
    authorName?: boolean
    walletAddress?: boolean
    isAccepted?: boolean
    createdAt?: boolean
    thread?: boolean | CommunityThreadDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["communityReply"]>

  export type CommunityReplySelectScalar = {
    id?: boolean
    threadId?: boolean
    body?: boolean
    authorName?: boolean
    walletAddress?: boolean
    isAccepted?: boolean
    createdAt?: boolean
  }

  export type CommunityReplyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "threadId" | "body" | "authorName" | "walletAddress" | "isAccepted" | "createdAt", ExtArgs["result"]["communityReply"]>
  export type CommunityReplyInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    thread?: boolean | CommunityThreadDefaultArgs<ExtArgs>
  }
  export type CommunityReplyIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    thread?: boolean | CommunityThreadDefaultArgs<ExtArgs>
  }
  export type CommunityReplyIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    thread?: boolean | CommunityThreadDefaultArgs<ExtArgs>
  }

  export type $CommunityReplyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CommunityReply"
    objects: {
      thread: Prisma.$CommunityThreadPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      threadId: bigint
      body: string
      authorName: string
      walletAddress: string | null
      isAccepted: boolean
      createdAt: Date
    }, ExtArgs["result"]["communityReply"]>
    composites: {}
  }

  type CommunityReplyGetPayload<S extends boolean | null | undefined | CommunityReplyDefaultArgs> = $Result.GetResult<Prisma.$CommunityReplyPayload, S>

  type CommunityReplyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CommunityReplyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CommunityReplyCountAggregateInputType | true
    }

  export interface CommunityReplyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CommunityReply'], meta: { name: 'CommunityReply' } }
    /**
     * Find zero or one CommunityReply that matches the filter.
     * @param {CommunityReplyFindUniqueArgs} args - Arguments to find a CommunityReply
     * @example
     * // Get one CommunityReply
     * const communityReply = await prisma.communityReply.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CommunityReplyFindUniqueArgs>(args: SelectSubset<T, CommunityReplyFindUniqueArgs<ExtArgs>>): Prisma__CommunityReplyClient<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CommunityReply that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CommunityReplyFindUniqueOrThrowArgs} args - Arguments to find a CommunityReply
     * @example
     * // Get one CommunityReply
     * const communityReply = await prisma.communityReply.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CommunityReplyFindUniqueOrThrowArgs>(args: SelectSubset<T, CommunityReplyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CommunityReplyClient<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CommunityReply that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityReplyFindFirstArgs} args - Arguments to find a CommunityReply
     * @example
     * // Get one CommunityReply
     * const communityReply = await prisma.communityReply.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CommunityReplyFindFirstArgs>(args?: SelectSubset<T, CommunityReplyFindFirstArgs<ExtArgs>>): Prisma__CommunityReplyClient<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CommunityReply that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityReplyFindFirstOrThrowArgs} args - Arguments to find a CommunityReply
     * @example
     * // Get one CommunityReply
     * const communityReply = await prisma.communityReply.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CommunityReplyFindFirstOrThrowArgs>(args?: SelectSubset<T, CommunityReplyFindFirstOrThrowArgs<ExtArgs>>): Prisma__CommunityReplyClient<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CommunityReplies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityReplyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CommunityReplies
     * const communityReplies = await prisma.communityReply.findMany()
     * 
     * // Get first 10 CommunityReplies
     * const communityReplies = await prisma.communityReply.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const communityReplyWithIdOnly = await prisma.communityReply.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CommunityReplyFindManyArgs>(args?: SelectSubset<T, CommunityReplyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CommunityReply.
     * @param {CommunityReplyCreateArgs} args - Arguments to create a CommunityReply.
     * @example
     * // Create one CommunityReply
     * const CommunityReply = await prisma.communityReply.create({
     *   data: {
     *     // ... data to create a CommunityReply
     *   }
     * })
     * 
     */
    create<T extends CommunityReplyCreateArgs>(args: SelectSubset<T, CommunityReplyCreateArgs<ExtArgs>>): Prisma__CommunityReplyClient<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CommunityReplies.
     * @param {CommunityReplyCreateManyArgs} args - Arguments to create many CommunityReplies.
     * @example
     * // Create many CommunityReplies
     * const communityReply = await prisma.communityReply.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CommunityReplyCreateManyArgs>(args?: SelectSubset<T, CommunityReplyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CommunityReplies and returns the data saved in the database.
     * @param {CommunityReplyCreateManyAndReturnArgs} args - Arguments to create many CommunityReplies.
     * @example
     * // Create many CommunityReplies
     * const communityReply = await prisma.communityReply.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CommunityReplies and only return the `id`
     * const communityReplyWithIdOnly = await prisma.communityReply.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CommunityReplyCreateManyAndReturnArgs>(args?: SelectSubset<T, CommunityReplyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CommunityReply.
     * @param {CommunityReplyDeleteArgs} args - Arguments to delete one CommunityReply.
     * @example
     * // Delete one CommunityReply
     * const CommunityReply = await prisma.communityReply.delete({
     *   where: {
     *     // ... filter to delete one CommunityReply
     *   }
     * })
     * 
     */
    delete<T extends CommunityReplyDeleteArgs>(args: SelectSubset<T, CommunityReplyDeleteArgs<ExtArgs>>): Prisma__CommunityReplyClient<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CommunityReply.
     * @param {CommunityReplyUpdateArgs} args - Arguments to update one CommunityReply.
     * @example
     * // Update one CommunityReply
     * const communityReply = await prisma.communityReply.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CommunityReplyUpdateArgs>(args: SelectSubset<T, CommunityReplyUpdateArgs<ExtArgs>>): Prisma__CommunityReplyClient<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CommunityReplies.
     * @param {CommunityReplyDeleteManyArgs} args - Arguments to filter CommunityReplies to delete.
     * @example
     * // Delete a few CommunityReplies
     * const { count } = await prisma.communityReply.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CommunityReplyDeleteManyArgs>(args?: SelectSubset<T, CommunityReplyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CommunityReplies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityReplyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CommunityReplies
     * const communityReply = await prisma.communityReply.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CommunityReplyUpdateManyArgs>(args: SelectSubset<T, CommunityReplyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CommunityReplies and returns the data updated in the database.
     * @param {CommunityReplyUpdateManyAndReturnArgs} args - Arguments to update many CommunityReplies.
     * @example
     * // Update many CommunityReplies
     * const communityReply = await prisma.communityReply.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CommunityReplies and only return the `id`
     * const communityReplyWithIdOnly = await prisma.communityReply.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CommunityReplyUpdateManyAndReturnArgs>(args: SelectSubset<T, CommunityReplyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CommunityReply.
     * @param {CommunityReplyUpsertArgs} args - Arguments to update or create a CommunityReply.
     * @example
     * // Update or create a CommunityReply
     * const communityReply = await prisma.communityReply.upsert({
     *   create: {
     *     // ... data to create a CommunityReply
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CommunityReply we want to update
     *   }
     * })
     */
    upsert<T extends CommunityReplyUpsertArgs>(args: SelectSubset<T, CommunityReplyUpsertArgs<ExtArgs>>): Prisma__CommunityReplyClient<$Result.GetResult<Prisma.$CommunityReplyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CommunityReplies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityReplyCountArgs} args - Arguments to filter CommunityReplies to count.
     * @example
     * // Count the number of CommunityReplies
     * const count = await prisma.communityReply.count({
     *   where: {
     *     // ... the filter for the CommunityReplies we want to count
     *   }
     * })
    **/
    count<T extends CommunityReplyCountArgs>(
      args?: Subset<T, CommunityReplyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CommunityReplyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CommunityReply.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityReplyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CommunityReplyAggregateArgs>(args: Subset<T, CommunityReplyAggregateArgs>): Prisma.PrismaPromise<GetCommunityReplyAggregateType<T>>

    /**
     * Group by CommunityReply.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CommunityReplyGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CommunityReplyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CommunityReplyGroupByArgs['orderBy'] }
        : { orderBy?: CommunityReplyGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CommunityReplyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCommunityReplyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CommunityReply model
   */
  readonly fields: CommunityReplyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CommunityReply.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CommunityReplyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    thread<T extends CommunityThreadDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CommunityThreadDefaultArgs<ExtArgs>>): Prisma__CommunityThreadClient<$Result.GetResult<Prisma.$CommunityThreadPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CommunityReply model
   */
  interface CommunityReplyFieldRefs {
    readonly id: FieldRef<"CommunityReply", 'BigInt'>
    readonly threadId: FieldRef<"CommunityReply", 'BigInt'>
    readonly body: FieldRef<"CommunityReply", 'String'>
    readonly authorName: FieldRef<"CommunityReply", 'String'>
    readonly walletAddress: FieldRef<"CommunityReply", 'String'>
    readonly isAccepted: FieldRef<"CommunityReply", 'Boolean'>
    readonly createdAt: FieldRef<"CommunityReply", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CommunityReply findUnique
   */
  export type CommunityReplyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * Filter, which CommunityReply to fetch.
     */
    where: CommunityReplyWhereUniqueInput
  }

  /**
   * CommunityReply findUniqueOrThrow
   */
  export type CommunityReplyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * Filter, which CommunityReply to fetch.
     */
    where: CommunityReplyWhereUniqueInput
  }

  /**
   * CommunityReply findFirst
   */
  export type CommunityReplyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * Filter, which CommunityReply to fetch.
     */
    where?: CommunityReplyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommunityReplies to fetch.
     */
    orderBy?: CommunityReplyOrderByWithRelationInput | CommunityReplyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CommunityReplies.
     */
    cursor?: CommunityReplyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommunityReplies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommunityReplies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CommunityReplies.
     */
    distinct?: CommunityReplyScalarFieldEnum | CommunityReplyScalarFieldEnum[]
  }

  /**
   * CommunityReply findFirstOrThrow
   */
  export type CommunityReplyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * Filter, which CommunityReply to fetch.
     */
    where?: CommunityReplyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommunityReplies to fetch.
     */
    orderBy?: CommunityReplyOrderByWithRelationInput | CommunityReplyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CommunityReplies.
     */
    cursor?: CommunityReplyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommunityReplies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommunityReplies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CommunityReplies.
     */
    distinct?: CommunityReplyScalarFieldEnum | CommunityReplyScalarFieldEnum[]
  }

  /**
   * CommunityReply findMany
   */
  export type CommunityReplyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * Filter, which CommunityReplies to fetch.
     */
    where?: CommunityReplyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CommunityReplies to fetch.
     */
    orderBy?: CommunityReplyOrderByWithRelationInput | CommunityReplyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CommunityReplies.
     */
    cursor?: CommunityReplyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CommunityReplies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CommunityReplies.
     */
    skip?: number
    distinct?: CommunityReplyScalarFieldEnum | CommunityReplyScalarFieldEnum[]
  }

  /**
   * CommunityReply create
   */
  export type CommunityReplyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * The data needed to create a CommunityReply.
     */
    data: XOR<CommunityReplyCreateInput, CommunityReplyUncheckedCreateInput>
  }

  /**
   * CommunityReply createMany
   */
  export type CommunityReplyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CommunityReplies.
     */
    data: CommunityReplyCreateManyInput | CommunityReplyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CommunityReply createManyAndReturn
   */
  export type CommunityReplyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * The data used to create many CommunityReplies.
     */
    data: CommunityReplyCreateManyInput | CommunityReplyCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * CommunityReply update
   */
  export type CommunityReplyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * The data needed to update a CommunityReply.
     */
    data: XOR<CommunityReplyUpdateInput, CommunityReplyUncheckedUpdateInput>
    /**
     * Choose, which CommunityReply to update.
     */
    where: CommunityReplyWhereUniqueInput
  }

  /**
   * CommunityReply updateMany
   */
  export type CommunityReplyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CommunityReplies.
     */
    data: XOR<CommunityReplyUpdateManyMutationInput, CommunityReplyUncheckedUpdateManyInput>
    /**
     * Filter which CommunityReplies to update
     */
    where?: CommunityReplyWhereInput
    /**
     * Limit how many CommunityReplies to update.
     */
    limit?: number
  }

  /**
   * CommunityReply updateManyAndReturn
   */
  export type CommunityReplyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * The data used to update CommunityReplies.
     */
    data: XOR<CommunityReplyUpdateManyMutationInput, CommunityReplyUncheckedUpdateManyInput>
    /**
     * Filter which CommunityReplies to update
     */
    where?: CommunityReplyWhereInput
    /**
     * Limit how many CommunityReplies to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * CommunityReply upsert
   */
  export type CommunityReplyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * The filter to search for the CommunityReply to update in case it exists.
     */
    where: CommunityReplyWhereUniqueInput
    /**
     * In case the CommunityReply found by the `where` argument doesn't exist, create a new CommunityReply with this data.
     */
    create: XOR<CommunityReplyCreateInput, CommunityReplyUncheckedCreateInput>
    /**
     * In case the CommunityReply was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CommunityReplyUpdateInput, CommunityReplyUncheckedUpdateInput>
  }

  /**
   * CommunityReply delete
   */
  export type CommunityReplyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
    /**
     * Filter which CommunityReply to delete.
     */
    where: CommunityReplyWhereUniqueInput
  }

  /**
   * CommunityReply deleteMany
   */
  export type CommunityReplyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CommunityReplies to delete
     */
    where?: CommunityReplyWhereInput
    /**
     * Limit how many CommunityReplies to delete.
     */
    limit?: number
  }

  /**
   * CommunityReply without action
   */
  export type CommunityReplyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CommunityReply
     */
    select?: CommunityReplySelect<ExtArgs> | null
    /**
     * Omit specific fields from the CommunityReply
     */
    omit?: CommunityReplyOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CommunityReplyInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CommunityThreadScalarFieldEnum: {
    id: 'id',
    type: 'type',
    title: 'title',
    body: 'body',
    authorName: 'authorName',
    walletAddress: 'walletAddress',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CommunityThreadScalarFieldEnum = (typeof CommunityThreadScalarFieldEnum)[keyof typeof CommunityThreadScalarFieldEnum]


  export const CommunityReplyScalarFieldEnum: {
    id: 'id',
    threadId: 'threadId',
    body: 'body',
    authorName: 'authorName',
    walletAddress: 'walletAddress',
    isAccepted: 'isAccepted',
    createdAt: 'createdAt'
  };

  export type CommunityReplyScalarFieldEnum = (typeof CommunityReplyScalarFieldEnum)[keyof typeof CommunityReplyScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type CommunityThreadWhereInput = {
    AND?: CommunityThreadWhereInput | CommunityThreadWhereInput[]
    OR?: CommunityThreadWhereInput[]
    NOT?: CommunityThreadWhereInput | CommunityThreadWhereInput[]
    id?: BigIntFilter<"CommunityThread"> | bigint | number
    type?: StringFilter<"CommunityThread"> | string
    title?: StringFilter<"CommunityThread"> | string
    body?: StringFilter<"CommunityThread"> | string
    authorName?: StringFilter<"CommunityThread"> | string
    walletAddress?: StringNullableFilter<"CommunityThread"> | string | null
    createdAt?: DateTimeFilter<"CommunityThread"> | Date | string
    updatedAt?: DateTimeFilter<"CommunityThread"> | Date | string
    replies?: CommunityReplyListRelationFilter
  }

  export type CommunityThreadOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    replies?: CommunityReplyOrderByRelationAggregateInput
  }

  export type CommunityThreadWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    AND?: CommunityThreadWhereInput | CommunityThreadWhereInput[]
    OR?: CommunityThreadWhereInput[]
    NOT?: CommunityThreadWhereInput | CommunityThreadWhereInput[]
    type?: StringFilter<"CommunityThread"> | string
    title?: StringFilter<"CommunityThread"> | string
    body?: StringFilter<"CommunityThread"> | string
    authorName?: StringFilter<"CommunityThread"> | string
    walletAddress?: StringNullableFilter<"CommunityThread"> | string | null
    createdAt?: DateTimeFilter<"CommunityThread"> | Date | string
    updatedAt?: DateTimeFilter<"CommunityThread"> | Date | string
    replies?: CommunityReplyListRelationFilter
  }, "id">

  export type CommunityThreadOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CommunityThreadCountOrderByAggregateInput
    _avg?: CommunityThreadAvgOrderByAggregateInput
    _max?: CommunityThreadMaxOrderByAggregateInput
    _min?: CommunityThreadMinOrderByAggregateInput
    _sum?: CommunityThreadSumOrderByAggregateInput
  }

  export type CommunityThreadScalarWhereWithAggregatesInput = {
    AND?: CommunityThreadScalarWhereWithAggregatesInput | CommunityThreadScalarWhereWithAggregatesInput[]
    OR?: CommunityThreadScalarWhereWithAggregatesInput[]
    NOT?: CommunityThreadScalarWhereWithAggregatesInput | CommunityThreadScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"CommunityThread"> | bigint | number
    type?: StringWithAggregatesFilter<"CommunityThread"> | string
    title?: StringWithAggregatesFilter<"CommunityThread"> | string
    body?: StringWithAggregatesFilter<"CommunityThread"> | string
    authorName?: StringWithAggregatesFilter<"CommunityThread"> | string
    walletAddress?: StringNullableWithAggregatesFilter<"CommunityThread"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CommunityThread"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"CommunityThread"> | Date | string
  }

  export type CommunityReplyWhereInput = {
    AND?: CommunityReplyWhereInput | CommunityReplyWhereInput[]
    OR?: CommunityReplyWhereInput[]
    NOT?: CommunityReplyWhereInput | CommunityReplyWhereInput[]
    id?: BigIntFilter<"CommunityReply"> | bigint | number
    threadId?: BigIntFilter<"CommunityReply"> | bigint | number
    body?: StringFilter<"CommunityReply"> | string
    authorName?: StringFilter<"CommunityReply"> | string
    walletAddress?: StringNullableFilter<"CommunityReply"> | string | null
    isAccepted?: BoolFilter<"CommunityReply"> | boolean
    createdAt?: DateTimeFilter<"CommunityReply"> | Date | string
    thread?: XOR<CommunityThreadScalarRelationFilter, CommunityThreadWhereInput>
  }

  export type CommunityReplyOrderByWithRelationInput = {
    id?: SortOrder
    threadId?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrderInput | SortOrder
    isAccepted?: SortOrder
    createdAt?: SortOrder
    thread?: CommunityThreadOrderByWithRelationInput
  }

  export type CommunityReplyWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    AND?: CommunityReplyWhereInput | CommunityReplyWhereInput[]
    OR?: CommunityReplyWhereInput[]
    NOT?: CommunityReplyWhereInput | CommunityReplyWhereInput[]
    threadId?: BigIntFilter<"CommunityReply"> | bigint | number
    body?: StringFilter<"CommunityReply"> | string
    authorName?: StringFilter<"CommunityReply"> | string
    walletAddress?: StringNullableFilter<"CommunityReply"> | string | null
    isAccepted?: BoolFilter<"CommunityReply"> | boolean
    createdAt?: DateTimeFilter<"CommunityReply"> | Date | string
    thread?: XOR<CommunityThreadScalarRelationFilter, CommunityThreadWhereInput>
  }, "id">

  export type CommunityReplyOrderByWithAggregationInput = {
    id?: SortOrder
    threadId?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrderInput | SortOrder
    isAccepted?: SortOrder
    createdAt?: SortOrder
    _count?: CommunityReplyCountOrderByAggregateInput
    _avg?: CommunityReplyAvgOrderByAggregateInput
    _max?: CommunityReplyMaxOrderByAggregateInput
    _min?: CommunityReplyMinOrderByAggregateInput
    _sum?: CommunityReplySumOrderByAggregateInput
  }

  export type CommunityReplyScalarWhereWithAggregatesInput = {
    AND?: CommunityReplyScalarWhereWithAggregatesInput | CommunityReplyScalarWhereWithAggregatesInput[]
    OR?: CommunityReplyScalarWhereWithAggregatesInput[]
    NOT?: CommunityReplyScalarWhereWithAggregatesInput | CommunityReplyScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"CommunityReply"> | bigint | number
    threadId?: BigIntWithAggregatesFilter<"CommunityReply"> | bigint | number
    body?: StringWithAggregatesFilter<"CommunityReply"> | string
    authorName?: StringWithAggregatesFilter<"CommunityReply"> | string
    walletAddress?: StringNullableWithAggregatesFilter<"CommunityReply"> | string | null
    isAccepted?: BoolWithAggregatesFilter<"CommunityReply"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"CommunityReply"> | Date | string
  }

  export type CommunityThreadCreateInput = {
    id?: bigint | number
    type: string
    title: string
    body: string
    authorName?: string
    walletAddress?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    replies?: CommunityReplyCreateNestedManyWithoutThreadInput
  }

  export type CommunityThreadUncheckedCreateInput = {
    id?: bigint | number
    type: string
    title: string
    body: string
    authorName?: string
    walletAddress?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    replies?: CommunityReplyUncheckedCreateNestedManyWithoutThreadInput
  }

  export type CommunityThreadUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommunityReplyUpdateManyWithoutThreadNestedInput
  }

  export type CommunityThreadUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    replies?: CommunityReplyUncheckedUpdateManyWithoutThreadNestedInput
  }

  export type CommunityThreadCreateManyInput = {
    id?: bigint | number
    type: string
    title: string
    body: string
    authorName?: string
    walletAddress?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommunityThreadUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommunityThreadUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommunityReplyCreateInput = {
    id?: bigint | number
    body: string
    authorName?: string
    walletAddress?: string | null
    isAccepted?: boolean
    createdAt?: Date | string
    thread: CommunityThreadCreateNestedOneWithoutRepliesInput
  }

  export type CommunityReplyUncheckedCreateInput = {
    id?: bigint | number
    threadId: bigint | number
    body: string
    authorName?: string
    walletAddress?: string | null
    isAccepted?: boolean
    createdAt?: Date | string
  }

  export type CommunityReplyUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    thread?: CommunityThreadUpdateOneRequiredWithoutRepliesNestedInput
  }

  export type CommunityReplyUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    threadId?: BigIntFieldUpdateOperationsInput | bigint | number
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommunityReplyCreateManyInput = {
    id?: bigint | number
    threadId: bigint | number
    body: string
    authorName?: string
    walletAddress?: string | null
    isAccepted?: boolean
    createdAt?: Date | string
  }

  export type CommunityReplyUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommunityReplyUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    threadId?: BigIntFieldUpdateOperationsInput | bigint | number
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CommunityReplyListRelationFilter = {
    every?: CommunityReplyWhereInput
    some?: CommunityReplyWhereInput
    none?: CommunityReplyWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CommunityReplyOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CommunityThreadCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CommunityThreadAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type CommunityThreadMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CommunityThreadMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    title?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CommunityThreadSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type CommunityThreadScalarRelationFilter = {
    is?: CommunityThreadWhereInput
    isNot?: CommunityThreadWhereInput
  }

  export type CommunityReplyCountOrderByAggregateInput = {
    id?: SortOrder
    threadId?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrder
    isAccepted?: SortOrder
    createdAt?: SortOrder
  }

  export type CommunityReplyAvgOrderByAggregateInput = {
    id?: SortOrder
    threadId?: SortOrder
  }

  export type CommunityReplyMaxOrderByAggregateInput = {
    id?: SortOrder
    threadId?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrder
    isAccepted?: SortOrder
    createdAt?: SortOrder
  }

  export type CommunityReplyMinOrderByAggregateInput = {
    id?: SortOrder
    threadId?: SortOrder
    body?: SortOrder
    authorName?: SortOrder
    walletAddress?: SortOrder
    isAccepted?: SortOrder
    createdAt?: SortOrder
  }

  export type CommunityReplySumOrderByAggregateInput = {
    id?: SortOrder
    threadId?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type CommunityReplyCreateNestedManyWithoutThreadInput = {
    create?: XOR<CommunityReplyCreateWithoutThreadInput, CommunityReplyUncheckedCreateWithoutThreadInput> | CommunityReplyCreateWithoutThreadInput[] | CommunityReplyUncheckedCreateWithoutThreadInput[]
    connectOrCreate?: CommunityReplyCreateOrConnectWithoutThreadInput | CommunityReplyCreateOrConnectWithoutThreadInput[]
    createMany?: CommunityReplyCreateManyThreadInputEnvelope
    connect?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
  }

  export type CommunityReplyUncheckedCreateNestedManyWithoutThreadInput = {
    create?: XOR<CommunityReplyCreateWithoutThreadInput, CommunityReplyUncheckedCreateWithoutThreadInput> | CommunityReplyCreateWithoutThreadInput[] | CommunityReplyUncheckedCreateWithoutThreadInput[]
    connectOrCreate?: CommunityReplyCreateOrConnectWithoutThreadInput | CommunityReplyCreateOrConnectWithoutThreadInput[]
    createMany?: CommunityReplyCreateManyThreadInputEnvelope
    connect?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type CommunityReplyUpdateManyWithoutThreadNestedInput = {
    create?: XOR<CommunityReplyCreateWithoutThreadInput, CommunityReplyUncheckedCreateWithoutThreadInput> | CommunityReplyCreateWithoutThreadInput[] | CommunityReplyUncheckedCreateWithoutThreadInput[]
    connectOrCreate?: CommunityReplyCreateOrConnectWithoutThreadInput | CommunityReplyCreateOrConnectWithoutThreadInput[]
    upsert?: CommunityReplyUpsertWithWhereUniqueWithoutThreadInput | CommunityReplyUpsertWithWhereUniqueWithoutThreadInput[]
    createMany?: CommunityReplyCreateManyThreadInputEnvelope
    set?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
    disconnect?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
    delete?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
    connect?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
    update?: CommunityReplyUpdateWithWhereUniqueWithoutThreadInput | CommunityReplyUpdateWithWhereUniqueWithoutThreadInput[]
    updateMany?: CommunityReplyUpdateManyWithWhereWithoutThreadInput | CommunityReplyUpdateManyWithWhereWithoutThreadInput[]
    deleteMany?: CommunityReplyScalarWhereInput | CommunityReplyScalarWhereInput[]
  }

  export type CommunityReplyUncheckedUpdateManyWithoutThreadNestedInput = {
    create?: XOR<CommunityReplyCreateWithoutThreadInput, CommunityReplyUncheckedCreateWithoutThreadInput> | CommunityReplyCreateWithoutThreadInput[] | CommunityReplyUncheckedCreateWithoutThreadInput[]
    connectOrCreate?: CommunityReplyCreateOrConnectWithoutThreadInput | CommunityReplyCreateOrConnectWithoutThreadInput[]
    upsert?: CommunityReplyUpsertWithWhereUniqueWithoutThreadInput | CommunityReplyUpsertWithWhereUniqueWithoutThreadInput[]
    createMany?: CommunityReplyCreateManyThreadInputEnvelope
    set?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
    disconnect?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
    delete?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
    connect?: CommunityReplyWhereUniqueInput | CommunityReplyWhereUniqueInput[]
    update?: CommunityReplyUpdateWithWhereUniqueWithoutThreadInput | CommunityReplyUpdateWithWhereUniqueWithoutThreadInput[]
    updateMany?: CommunityReplyUpdateManyWithWhereWithoutThreadInput | CommunityReplyUpdateManyWithWhereWithoutThreadInput[]
    deleteMany?: CommunityReplyScalarWhereInput | CommunityReplyScalarWhereInput[]
  }

  export type CommunityThreadCreateNestedOneWithoutRepliesInput = {
    create?: XOR<CommunityThreadCreateWithoutRepliesInput, CommunityThreadUncheckedCreateWithoutRepliesInput>
    connectOrCreate?: CommunityThreadCreateOrConnectWithoutRepliesInput
    connect?: CommunityThreadWhereUniqueInput
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type CommunityThreadUpdateOneRequiredWithoutRepliesNestedInput = {
    create?: XOR<CommunityThreadCreateWithoutRepliesInput, CommunityThreadUncheckedCreateWithoutRepliesInput>
    connectOrCreate?: CommunityThreadCreateOrConnectWithoutRepliesInput
    upsert?: CommunityThreadUpsertWithoutRepliesInput
    connect?: CommunityThreadWhereUniqueInput
    update?: XOR<XOR<CommunityThreadUpdateToOneWithWhereWithoutRepliesInput, CommunityThreadUpdateWithoutRepliesInput>, CommunityThreadUncheckedUpdateWithoutRepliesInput>
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type CommunityReplyCreateWithoutThreadInput = {
    id?: bigint | number
    body: string
    authorName?: string
    walletAddress?: string | null
    isAccepted?: boolean
    createdAt?: Date | string
  }

  export type CommunityReplyUncheckedCreateWithoutThreadInput = {
    id?: bigint | number
    body: string
    authorName?: string
    walletAddress?: string | null
    isAccepted?: boolean
    createdAt?: Date | string
  }

  export type CommunityReplyCreateOrConnectWithoutThreadInput = {
    where: CommunityReplyWhereUniqueInput
    create: XOR<CommunityReplyCreateWithoutThreadInput, CommunityReplyUncheckedCreateWithoutThreadInput>
  }

  export type CommunityReplyCreateManyThreadInputEnvelope = {
    data: CommunityReplyCreateManyThreadInput | CommunityReplyCreateManyThreadInput[]
    skipDuplicates?: boolean
  }

  export type CommunityReplyUpsertWithWhereUniqueWithoutThreadInput = {
    where: CommunityReplyWhereUniqueInput
    update: XOR<CommunityReplyUpdateWithoutThreadInput, CommunityReplyUncheckedUpdateWithoutThreadInput>
    create: XOR<CommunityReplyCreateWithoutThreadInput, CommunityReplyUncheckedCreateWithoutThreadInput>
  }

  export type CommunityReplyUpdateWithWhereUniqueWithoutThreadInput = {
    where: CommunityReplyWhereUniqueInput
    data: XOR<CommunityReplyUpdateWithoutThreadInput, CommunityReplyUncheckedUpdateWithoutThreadInput>
  }

  export type CommunityReplyUpdateManyWithWhereWithoutThreadInput = {
    where: CommunityReplyScalarWhereInput
    data: XOR<CommunityReplyUpdateManyMutationInput, CommunityReplyUncheckedUpdateManyWithoutThreadInput>
  }

  export type CommunityReplyScalarWhereInput = {
    AND?: CommunityReplyScalarWhereInput | CommunityReplyScalarWhereInput[]
    OR?: CommunityReplyScalarWhereInput[]
    NOT?: CommunityReplyScalarWhereInput | CommunityReplyScalarWhereInput[]
    id?: BigIntFilter<"CommunityReply"> | bigint | number
    threadId?: BigIntFilter<"CommunityReply"> | bigint | number
    body?: StringFilter<"CommunityReply"> | string
    authorName?: StringFilter<"CommunityReply"> | string
    walletAddress?: StringNullableFilter<"CommunityReply"> | string | null
    isAccepted?: BoolFilter<"CommunityReply"> | boolean
    createdAt?: DateTimeFilter<"CommunityReply"> | Date | string
  }

  export type CommunityThreadCreateWithoutRepliesInput = {
    id?: bigint | number
    type: string
    title: string
    body: string
    authorName?: string
    walletAddress?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommunityThreadUncheckedCreateWithoutRepliesInput = {
    id?: bigint | number
    type: string
    title: string
    body: string
    authorName?: string
    walletAddress?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CommunityThreadCreateOrConnectWithoutRepliesInput = {
    where: CommunityThreadWhereUniqueInput
    create: XOR<CommunityThreadCreateWithoutRepliesInput, CommunityThreadUncheckedCreateWithoutRepliesInput>
  }

  export type CommunityThreadUpsertWithoutRepliesInput = {
    update: XOR<CommunityThreadUpdateWithoutRepliesInput, CommunityThreadUncheckedUpdateWithoutRepliesInput>
    create: XOR<CommunityThreadCreateWithoutRepliesInput, CommunityThreadUncheckedCreateWithoutRepliesInput>
    where?: CommunityThreadWhereInput
  }

  export type CommunityThreadUpdateToOneWithWhereWithoutRepliesInput = {
    where?: CommunityThreadWhereInput
    data: XOR<CommunityThreadUpdateWithoutRepliesInput, CommunityThreadUncheckedUpdateWithoutRepliesInput>
  }

  export type CommunityThreadUpdateWithoutRepliesInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommunityThreadUncheckedUpdateWithoutRepliesInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    type?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommunityReplyCreateManyThreadInput = {
    id?: bigint | number
    body: string
    authorName?: string
    walletAddress?: string | null
    isAccepted?: boolean
    createdAt?: Date | string
  }

  export type CommunityReplyUpdateWithoutThreadInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommunityReplyUncheckedUpdateWithoutThreadInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CommunityReplyUncheckedUpdateManyWithoutThreadInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    body?: StringFieldUpdateOperationsInput | string
    authorName?: StringFieldUpdateOperationsInput | string
    walletAddress?: NullableStringFieldUpdateOperationsInput | string | null
    isAccepted?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}