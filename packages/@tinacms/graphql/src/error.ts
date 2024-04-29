import { ASTNode, GraphQLError, GraphQLErrorExtensions, Source } from 'graphql'

export class NotFoundError extends GraphQLError {
  constructor(
    message: string,
    nodes?: ASTNode | readonly ASTNode[],
    source?: Source,
    positions?: readonly number[],
    path?: readonly (string | number)[],
    originalError?: Error,
    extensions?: GraphQLErrorExtensions
  ) {
    super(message, nodes, source, positions, path, originalError, extensions)
    this.name = 'NotFoundError'
  }
}

export class DatabaseInitError extends Error {
  public type: string

  constructor(type: string, message: string) {
    super(message)
    this.name = 'DatabaseInitError'
    this.type = type
  }
}
