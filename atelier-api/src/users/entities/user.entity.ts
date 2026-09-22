import { Role } from '../../../generated/prisma/enums.js';

export class User {
  id!: number;
  name!: string;
  username!: string;
  email!: string;
  phone!: string | null;
  role!: Role;
  createdAt!: Date;
  updatedAt!: Date;
}
