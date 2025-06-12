// frontend\lib\types.ts
export enum UserRole {
  Student = 'Student',
  Admin = 'Admin',
  Operator = 'Operator',
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface AuthData {
  accessToken: string;
  user: User;
}

export enum ContainerStatus {
  OK = 'OK',
  FULL = 'FULL',
  DAMAGED = 'DAMAGED',
}

export enum ContainerType {
  GENERAL = 'GENERAL',
  PAPER = 'PAPER',
  PLASTIC = 'PLASTIC',
  GLASS = 'GLASS',
  ORGANIC = 'ORGANIC',
  METAL = 'METAL',
  ELECTRONICS = 'ELECTRONICS',
  BATTERIES = 'BATTERIES',
  CLOTHING = 'CLOTHING',
  OIL = 'OIL',
  OTHERS = 'OTHERS',
}

export interface Container {
  id: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  capacity: number;
  fillLevel: number;
  status: ContainerStatus;
  type: ContainerType;
  lastEmptiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContainerWithOperators extends Container {
  assignedToOperators?: User[];
}

export interface ContainerWithDistance extends Container {
  distance: number;
}

export enum IncidentType {
  FULL = 'FULL',
  DAMAGED = 'DAMAGED',
}

export interface SubscriptionFormValues {
  email: string;
}

export interface ReportIncidentFormValues {
  containerId: string; 
  description: string;
  imageUrl?: string;
}

export interface Task {
  id: string; 
  location: string;
  fillLevel: number;
  status: ContainerStatus;
  containerType: ContainerType;
  description: string;
  lastUpdated: Date;
}

export interface Operator {
  id: string;
  email: string;
  name: string;
  assignedContainerIds: string[]; 
}