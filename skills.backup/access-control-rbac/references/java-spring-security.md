# Java Spring Security Implementation

Enterprise RBAC with Spring Security and method-level security.

```java
package com.example.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2.jwt());

        return http.build();
    }
}
```

## Custom Permission Service

```java
package com.example.security;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;

@Service
public class AccessControlService {

    private final Map<String, Set<String>> rolePermissions = new HashMap<>();

    public AccessControlService() {
        rolePermissions.put("ADMIN", Set.of(
            "users:read", "users:write", "users:delete",
            "reports:read", "reports:write",
            "settings:read", "settings:write"
        ));
        rolePermissions.put("MANAGER", Set.of(
            "users:read", "users:write",
            "reports:read", "reports:write"
        ));
        rolePermissions.put("USER", Set.of(
            "users:read",
            "reports:read"
        ));
    }

    public boolean hasPermission(String role, String resource, String action) {
        String permission = resource + ":" + action;
        Set<String> permissions = rolePermissions.get(role);
        return permissions != null && permissions.contains(permission);
    }

    public boolean canAccessResource(User user, String resourceOwnerId) {
        // Check if user owns the resource or is admin
        return user.getId().equals(resourceOwnerId) ||
               user.getRoles().contains("ADMIN");
    }
}
```

## Method-Level Security

```java
package com.example.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('users:read')")
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    @GetMapping("/{id}")
    @PostAuthorize("returnObject.id == authentication.principal.id or hasRole('ADMIN')")
    public User getUser(@PathVariable String id) {
        return userService.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("@accessControlService.canAccessResource(authentication.principal, #id)")
    public User updateUser(@PathVariable String id, @RequestBody User user) {
        return userService.update(id, user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(@PathVariable String id) {
        userService.delete(id);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('MANAGER') and @accessControlService.hasPermission(" +
                  "authentication.principal.role, 'users', 'approve')")
    public User approveUser(@PathVariable String id) {
        return userService.approve(id);
    }
}
```

## Custom Security Expression

```java
package com.example.security;

import org.springframework.security.access.expression.SecurityExpressionRoot;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.core.Authentication;

public class CustomMethodSecurityExpressionRoot
        extends SecurityExpressionRoot
        implements MethodSecurityExpressionOperations {

    private Object filterObject;
    private Object returnObject;

    public CustomMethodSecurityExpressionRoot(Authentication authentication) {
        super(authentication);
    }

    public boolean isResourceOwner(String resourceOwnerId) {
        User user = (User) this.getPrincipal();
        return user.getId().equals(resourceOwnerId);
    }

    public boolean hasDepartment(String department) {
        User user = (User) this.getPrincipal();
        return department.equals(user.getDepartment());
    }

    // Required interface methods
    @Override
    public void setFilterObject(Object filterObject) {
        this.filterObject = filterObject;
    }

    @Override
    public Object getFilterObject() {
        return filterObject;
    }

    @Override
    public void setReturnObject(Object returnObject) {
        this.returnObject = returnObject;
    }

    @Override
    public Object getReturnObject() {
        return returnObject;
    }

    @Override
    public Object getThis() {
        return this;
    }
}
```
