export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface ChangePasswordRequest {
  oldPassword?: string;
  newPassword?: string;
}
