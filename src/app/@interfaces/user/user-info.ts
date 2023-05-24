export interface UserInfo {
  email: string;
  firstName: string;
  lastName: string;
  roles: {
    isDev: boolean;
    isLead: boolean;
  }
}
