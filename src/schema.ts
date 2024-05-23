import { PrismaClient } from "@prisma/client";
import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import { createSchema } from "graphql-yoga";

const typeDefinitions = /* GraphQL */ `
  scalar Date

  type Organization {
    id: Int!
    name: String!
    employees: [Employee!]!
  }

  type Employee {
    id: Int!
    firstName: String!
    lastName: String!
    dateOfJoining: Date!
    dateOfBirth: Date!
    salary: Float!
    title: String!
    department: String!
    organization: Organization!
  }

  type Query {
    organizations: [Organization!]!
    organization(id: Int!): Organization
    employees(
      filterTitle: String
      filterDepartment: String
      filterSalaryRange: SalaryRangeInput
      skip: Int
      take: Int
      sortBy: EmployeeSortInput
    ): [Employee!]!
    employee(id: Int!): Employee
  }

  type Mutation {
    addOrganization(name: String!): Organization
    addEmployee(
      firstName: String!
      lastName: String!
      dateOfJoining: Date!
      dateOfBirth: Date!
      salary: Float!
      title: String!
      department: String!
      organizationId: Int!
    ): Employee
    updateEmployee(
      id: Int!
      firstName: String
      lastName: String
      dateOfJoining: Date
      dateOfBirth: Date
      salary: Float
      title: String
      department: String
      organizationId: Int
    ): Employee
    deleteEmployee(id: Int!): Employee
  }

  input SalaryRangeInput {
    min: Float
    max: Float
  }

  input EmployeeSortInput {
    field: EmployeeSortField!
    order: SortOrder!
  }

  enum EmployeeSortField {
    dateOfJoining
    salary
  }

  enum SortOrder {
    asc
    desc
  }
`;

const applyTakeConstraints = (params: {
  min: number;
  max: number;
  value: number;
}) => {
  if (params.value < params.min || params.value > params.max) {
    throw new GraphQLError(
      `'take' argument value '${params.value}' is outside the valid range of '${params.min}' to '${params.max}'.`
    );
  }
  return params.value;
};

const DateScalar = new GraphQLScalarType({
  name: "Date",
  description: "Custom Date scalar type",
  parseValue(value: any) {
    return new Date(value); // Convert incoming integer to Date
  },
  serialize(value: any) {
    return value.toISOString(); // Convert Date to string for outgoing
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // Convert hard-coded AST string to integer and then to Date
    }
    return null;
  },
});

const resolvers = {
  Date: DateScalar,
  Query: {
    async organizations(
      _parent: unknown,
      _args: {},
      context: { prisma: PrismaClient }
    ) {
      try {
        return await context.prisma.organization.findMany();
      } catch (error) {
        throw new GraphQLError("Failed to fetch organizations");
      }
    },
    async organization(
      _parent: unknown,
      args: { id: number },
      context: { prisma: PrismaClient }
    ) {
      try {
        return await context.prisma.organization.findUnique({
          where: { id: args.id },
          include: { employees: true },
        });
      } catch (error) {
        throw new GraphQLError("Failed to fetch organization");
      }
    },
    async employees(
      _parent: unknown,
      args: {
        filterTitle?: string;
        filterDepartment?: string;
        filterSalaryRange?: { min: number; max: number };
        skip?: number;
        take?: number;
        sortBy?: { field: string; order: string };
      },
      context: { prisma: PrismaClient }
    ) {
      const where = {
        AND: [
          args.filterTitle ? { title: { contains: args.filterTitle } } : {},
          args.filterDepartment
            ? { department: { contains: args.filterDepartment } }
            : {},
          args.filterSalaryRange
            ? {
                salary: {
                  gte: args.filterSalaryRange.min,
                  lte: args.filterSalaryRange.max,
                },
              }
            : {},
        ].filter(Boolean),
      };

      const take = applyTakeConstraints({
        min: 1,
        max: 50,
        value: args.take ?? 30,
      });

      const orderBy = args.sortBy
        ? {
            [args.sortBy.field]: args.sortBy.order,
          }
        : {};

      try {
        return await context.prisma.employee.findMany({
          where,
          skip: args.skip,
          take,
          orderBy,
          include: { organization: true },
        });
      } catch (error) {
        throw new GraphQLError("Failed to fetch employees");
      }
    },
    async employee(
      _parent: unknown,
      args: { id: number },
      context: { prisma: PrismaClient }
    ) {
      try {
        return await context.prisma.employee.findUnique({
          where: { id: args.id },
          include: { organization: true },
        });
      } catch (error) {
        throw new GraphQLError("Failed to fetch employee");
      }
    },
  },
  Mutation: {
    async addOrganization(
      _parent: unknown,
      args: { name: string },
      context: { prisma: PrismaClient }
    ) {
      try {
        return await context.prisma.organization.create({
          data: { name: args.name },
        });
      } catch (error) {
        throw new GraphQLError("Failed to add organization");
      }
    },
    async addEmployee(
      _parent: unknown,
      args: {
        firstName: string;
        lastName: string;
        dateOfJoining: Date;
        dateOfBirth: Date;
        salary: number;
        title: string;
        department: string;
        organizationId: number;
      },
      context: { prisma: PrismaClient }
    ) {
      try {
        return await context.prisma.employee.create({
          data: {
            ...args,
            dateOfJoining: new Date(args.dateOfJoining),
            dateOfBirth: new Date(args.dateOfBirth),
          },
        });
      } catch (error) {
        throw new GraphQLError("Failed to add employee");
      }
    },
    async updateEmployee(
      _parent: unknown,
      args: {
        id: number;
        firstName?: string;
        lastName?: string;
        dateOfJoining?: Date;
        dateOfBirth?: Date;
        salary?: number;
        title?: string;
        department?: string;
        organizationId?: number;
      },
      context: { prisma: PrismaClient }
    ) {
      const { id, dateOfJoining, dateOfBirth, ...data } = args;
      try {
        return await context.prisma.employee.update({
          where: { id },
          data: {
            ...data,
            ...(dateOfJoining
              ? { dateOfJoining: new Date(dateOfJoining) }
              : {}),
            ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
          },
        });
      } catch (error) {
        throw new GraphQLError("Failed to update employee");
      }
    },
    async deleteEmployee(
      _parent: unknown,
      args: { id: number },
      context: { prisma: PrismaClient }
    ) {
      try {
        return await context.prisma.employee.delete({
          where: { id: args.id },
        });
      } catch (error) {
        throw new GraphQLError("Failed to delete employee");
      }
    },
  },
};

export const schema = createSchema({
  resolvers: [resolvers],
  typeDefs: [typeDefinitions],
});
