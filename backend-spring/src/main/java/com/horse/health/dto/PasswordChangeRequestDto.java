package com.horse.health.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PasswordChangeRequestDto {
    private String username;
    private String currentPassword;
    private String newPassword;
}