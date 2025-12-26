---
title: SpringSecurity核心概念与架构详解
tag:
  - Spring Security
  - Spring Boot
  - 安全框架
  - 认证授权
category: Spring Security
description: 深入解析Spring Security的核心概念、架构设计、认证授权机制以及安全过滤器链的工作原理，涵盖从基础概念到高级特性的完整知识体系。
date: 2025-12-26

author: nikola
icon: shield

isOriginal: true
sticky: false
timeline: true
article: true
star: false
---

## 1. 简介

Spring Security是Spring生态系统中最重要、最强大的安全框架，为企业级应用提供了全面的安全解决方案。它基于Spring框架构建，深度集成了Spring的依赖注入和AOP特性，为Web应用、方法调用、消息传递等提供了统一的安全保护机制。

本文将深入解析Spring Security的核心概念、架构设计、认证授权机制以及安全过滤器链的工作原理，帮助开发者全面掌握这一强大的安全框架。

## 2. Spring Security核心概念

### 2.1 认证（Authentication）与授权（Authorization）

**认证（Authentication）**：验证用户身份的过程，回答"你是谁？"的问题。

**授权（Authorization）**：验证用户权限的过程，回答"你能做什么？"的问题。

```java
// Spring Security中的认证和授权示例
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 认证配置
            .authenticationManager(authenticationManager())
            // 授权配置
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/admin/**").hasRole("ADMIN")  // 授权
                .requestMatchers("/user/**").hasRole("USER")    // 授权
                .anyRequest().authenticated()                    // 认证
            );
            
        return http.build();
    }
    
    @Bean
    public AuthenticationManager authenticationManager() {
        // 认证管理器实现
        return authentication -> {
            String username = authentication.getName();
            String password = authentication.getCredentials().toString();
            // 认证逻辑...
            return new UsernamePasswordAuthenticationToken(username, password, authorities);
        };
    }
}
```

### 2.2 安全上下文（Security Context）

Security Context是Spring Security的核心组件，用于存储当前线程的认证信息。

```java
// Security Context的使用示例
@Service
public class UserService {
    
    public String getCurrentUsername() {
        // 从Security Context获取当前认证信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        
        return "anonymous";
    }
    
    public boolean hasRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null) {
            return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
        }
        
        return false;
    }
}
```

### 2.3 权限（Authority）与角色（Role）

Spring Security中，权限和角色都是GrantedAuthority接口的实现：

- **权限（Authority）**：具体的操作权限，如"READ_USER"、"WRITE_USER"
- **角色（Role）**：权限的集合，如"ROLE_ADMIN"、"ROLE_USER"

```java
// 权限和角色的定义与使用
@Component
public class CustomUserDetailsService implements UserDetailsService {
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 根据用户名加载用户信息
        return User.builder()
            .username(username)
            .password(encodedPassword)
            // 分配权限
            .authorities("READ_USER", "WRITE_USER")
            // 分配角色
            .roles("ADMIN", "USER")
            .build();
    }
}

// 在配置中使用角色和权限
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class MethodSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz
            .requestMatchers("/admin/**").hasRole("ADMIN")           // 基于角色
            .requestMatchers("/api/users/**").hasAuthority("READ_USER") // 基于权限
            .anyRequest().authenticated()
        );
        
        return http.build();
    }
}

// 方法级安全控制
@Service
public class UserService {
    
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('READ_USER')")
    public User getUserById(Long id) {
        // 只有ADMIN角色或有READ_USER权限的用户可以调用此方法
        return userRepository.findById(id);
    }
    
    @PreAuthorize("hasAuthority('WRITE_USER')")
    public User createUser(User user) {
        // 只有有WRITE_USER权限的用户可以调用此方法
        return userRepository.save(user);
    }
}
```

## 3. Spring Security架构设计

### 3.1 安全过滤器链（Security Filter Chain）

Spring Security的核心是一个可配置的过滤器链，请求会依次通过多个安全过滤器：

```java
// Spring Security过滤器链的典型配置
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. 认证过滤器
            .addFilterBefore(new CustomAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class)
            // 2. 授权过滤器
            .authorizeHttpRequests(authz -> authz.anyRequest().authenticated())
            // 3. 会话管理
            .sessionManagement(session -> session
                .maximumSessions(1)
                .maxSessionsPreventsLogin(true)
            )
            // 4. CSRF保护
            .csrf(Customizer.withDefaults())
            // 5. 异常处理
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new CustomAuthenticationEntryPoint())
                .accessDeniedHandler(new CustomAccessDeniedHandler())
            );
            
        return http.build();
    }
}

// 自定义认证过滤器
public class CustomAuthenticationFilter extends OncePerRequestFilter {
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        // 从请求头提取token
        String token = extractToken(request);
        
        if (token != null && validateToken(token)) {
            // 创建认证对象
            Authentication authentication = createAuthentication(token);
            // 设置到Security Context
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### 3.2 认证管理器（Authentication Manager）

Authentication Manager负责协调认证过程，支持多种认证提供器：

```java
// 认证管理器配置
@Configuration
@EnableWebSecurity
public class AuthenticationConfig {
    
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
    
    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService());
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }
    
    @Bean
    public JwtAuthenticationProvider jwtAuthenticationProvider() {
        return new JwtAuthenticationProvider(jwtDecoder());
    }
    
    @Bean
    public ProviderManager providerManager() {
        List<AuthenticationProvider> providers = Arrays.asList(
            daoAuthenticationProvider(),
            jwtAuthenticationProvider()
        );
        return new ProviderManager(providers);
    }
}

// JWT认证提供器
public class JwtAuthenticationProvider implements AuthenticationProvider {
    
    private final JwtDecoder jwtDecoder;
    
    public JwtAuthenticationProvider(JwtDecoder jwtDecoder) {
        this.jwtDecoder = jwtDecoder;
    }
    
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        try {
            Jwt jwt = jwtDecoder.decode((String) authentication.getCredentials());
            
            // 从JWT中提取用户信息和权限
            String username = jwt.getSubject();
            Collection<? extends GrantedAuthority> authorities = extractAuthorities(jwt);
            
            return new JwtAuthenticationToken(jwt, authorities);
        } catch (JwtException e) {
            throw new BadCredentialsException("Invalid JWT token", e);
        }
    }
    
    @Override
    public boolean supports(Class<?> authentication) {
        return JwtAuthenticationToken.class.isAssignableFrom(authentication);
    }
}
```

### 3.3 访问决策管理器（Access Decision Manager）

Access Decision Manager负责决定用户是否有权访问特定资源：

```java
// 访问决策管理器配置
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class AccessDecisionConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz
            .requestMatchers("/public/**").permitAll()
            .requestMatchers("/admin/**").access(accessDecisionManager())
            .anyRequest().authenticated()
        );
        
        return http.build();
    }
    
    @Bean
    public AccessDecisionManager accessDecisionManager() {
        List<AccessDecisionVoter<?>> decisionVoters = Arrays.asList(
            new RoleVoter(),
            new AuthenticatedVoter(),
            new CustomVoter()
        );
        
        return new AffirmativeBased(decisionVoters);
    }
}

// 自定义投票器
public class CustomVoter implements AccessDecisionVoter<Object> {
    
    @Override
    public boolean supports(ConfigAttribute attribute) {
        return attribute.getAttribute().startsWith("CUSTOM_");
    }
    
    @Override
    public boolean supports(Class<?> clazz) {
        return true;
    }
    
    @Override
    public int vote(Authentication authentication, Object object, 
                   Collection<ConfigAttribute> attributes) {
        
        for (ConfigAttribute attribute : attributes) {
            if (supports(attribute)) {
                // 自定义投票逻辑
                if (hasCustomPermission(authentication, attribute)) {
                    return ACCESS_GRANTED;
                } else {
                    return ACCESS_DENIED;
                }
            }
        }
        
        return ACCESS_ABSTAIN;
    }
    
    private boolean hasCustomPermission(Authentication authentication, ConfigAttribute attribute) {
        // 自定义权限检查逻辑
        return true;
    }
}
```

## 4. 认证机制详解

### 4.1 基于表单的认证

```java
// 表单登录配置
@Configuration
@EnableWebSecurity
public class FormLoginConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .formLogin(form -> form
                .loginPage("/login")                    // 自定义登录页面
                .loginProcessingUrl("/auth/login")      // 登录处理URL
                .defaultSuccessUrl("/dashboard")        // 登录成功重定向
                .failureUrl("/login?error=true")        // 登录失败重定向
                .usernameParameter("email")            // 自定义用户名参数
                .passwordParameter("pwd")              // 自定义密码参数
                .permitAll()                            // 允许所有人访问登录页面
            )
            .logout(logout -> logout
                .logoutUrl("/auth/logout")              // 登出URL
                .logoutSuccessUrl("/login?logout=true") // 登出成功重定向
                .invalidateHttpSession(true)            // 使会话失效
                .deleteCookies("JSESSIONID")           // 删除Cookie
            );
            
        return http.build();
    }
}

// 自定义登录页面控制器
@Controller
public class LoginController {
    
    @GetMapping("/login")
    public String loginPage() {
        return "login";
    }
    
    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }
}
```

### 4.2 基于JWT的认证

```java
// JWT认证配置
@Configuration
@EnableWebSecurity
public class JwtSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }
    
    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(
            Keys.hmacShaKeyFor("mySecretKey".getBytes())
        ).build();
    }
    
    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(
            new ImmutableSecret<>(Keys.hmacShaKeyFor("mySecretKey".getBytes()))
        );
    }
}

// JWT认证过滤器
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtDecoder jwtDecoder;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        
        String token = extractToken(request);
        
        if (token != null) {
            try {
                Jwt jwt = jwtDecoder.decode(token);
                Authentication authentication = createAuthentication(jwt);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (JwtException e) {
                // Token验证失败
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
    
    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
    
    private Authentication createAuthentication(Jwt jwt) {
        String username = jwt.getSubject();
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        return new JwtAuthenticationToken(jwt, authorities);
    }
}
```

### 4.3 OAuth2认证集成

```java
// OAuth2客户端配置
@Configuration
@EnableWebSecurity
public class OAuth2SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2Login(oauth2 -> oauth2
                .loginPage("/login")
                .defaultSuccessUrl("/dashboard")
                .failureUrl("/login?error=true")
                .authorizationEndpoint(authorization -> authorization
                    .baseUri("/oauth2/authorization")
                )
                .redirectionEndpoint(redirection -> redirection
                    .baseUri("/login/oauth2/code/*")
                )
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
            )
            .oauth2Client(withDefaults());
            
        return http.build();
    }
    
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository() {
        return new InMemoryClientRegistrationRepository(
            googleClientRegistration(),
            githubClientRegistration()
        );
    }
    
    private ClientRegistration googleClientRegistration() {
        return ClientRegistration.withRegistrationId("google")
            .clientId("google-client-id")
            .clientSecret("google-client-secret")
            .scope("openid", "profile", "email")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://www.googleapis.com/oauth2/v4/token")
            .userInfoUri("https://www.googleapis.com/oauth2/v3/userinfo")
            .userNameAttributeName(IdTokenClaimNames.SUB)
            .clientName("Google")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .build();
    }
}

// 自定义OAuth2用户服务
@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        
        // 处理OAuth2用户信息
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        
        // 保存或更新用户信息到数据库
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> createNewUser(email, name));
        
        return new CustomOAuth2User(oauth2User, user);
    }
    
    private User createNewUser(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setEnabled(true);
        return userRepository.save(user);
    }
}
```

## 5. 授权机制详解

### 5.1 基于URL的授权

```java
// URL级别授权配置
@Configuration
@EnableWebSecurity
public class UrlBasedSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz
            // 公开访问
            .requestMatchers("/", "/home", "/about").permitAll()
            .requestMatchers("/css/**", "/js/**", "/images/**").permitAll()
            
            // 基于角色的访问控制
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .requestMatchers("/manager/**").hasAnyRole("ADMIN", "MANAGER")
            
            // 基于权限的访问控制
            .requestMatchers("/api/users/**").hasAuthority("USER_READ")
            .requestMatchers("/api/users/*/edit").hasAuthority("USER_WRITE")
            
            // 基于IP的访问控制
            .requestMatchers("/internal/**").hasIpAddress("192.168.1.0/24")
            
            // 自定义访问控制
            .requestMatchers("/special/**").access(new WebExpressionAuthorizationManager(
                "hasRole('ADMIN') and hasIpAddress('192.168.1.100')"
            ))
            
            // 其他请求需要认证
            .anyRequest().authenticated()
        );
        
        return http.build();
    }
}
```

### 5.2 基于方法的授权

```java
// 方法级别安全配置
@Configuration
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class MethodSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz.anyRequest().authenticated());
        return http.build();
    }
}

// 服务层方法安全控制
@Service
public class UserService {
    
    // 使用@PreAuthorize进行前置授权检查
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public User getUserById(Long userId) {
        return userRepository.findById(userId);
    }
    
    // 使用@PostAuthorize进行后置授权检查
    @PostAuthorize("returnObject.owner == authentication.name")
    public Document getDocument(Long id) {
        return documentRepository.findById(id);
    }
    
    // 使用@Secured进行基于角色的授权
    @Secured({"ROLE_ADMIN", "ROLE_MANAGER"})
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
    
    // 使用JSR-250注解
    @RolesAllowed({"ADMIN", "MANAGER"})
    public void updateUser(User user) {
        userRepository.save(user);
    }
    
    // 使用自定义权限表达式
    @PreAuthorize("@securityService.canAccessUser(#userId)")
    public void updateUserProfile(Long userId, UserProfile profile) {
        // 业务逻辑
    }
}

// 自定义安全服务
@Service
public class SecurityService {
    
    public boolean canAccessUser(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 自定义权限检查逻辑
        if (authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"))) {
            return true;
        }
        
        // 检查是否是当前用户
        User currentUser = (User) authentication.getPrincipal();
        return currentUser.getId().equals(userId);
    }
}
```

## 6. 高级特性与最佳实践

### 6.1 安全事件监听

```java
// 安全事件监听器配置
@Component
public class SecurityEventListener {
    
    private static final Logger logger = LoggerFactory.getLogger(SecurityEventListener.class);
    
    @EventListener
    public void handleAuthenticationSuccess(AuthenticationSuccessEvent event) {
        Authentication authentication = event.getAuthentication();
        logger.info("用户 {} 登录成功", authentication.getName());
        
        // 记录登录日志
        auditService.recordLoginSuccess(authentication.getName());
    }
    
    @EventListener
    public void handleAuthenticationFailure(AbstractAuthenticationFailureEvent event) {
        Authentication authentication = event.getAuthentication();
        logger.warn("用户 {} 登录失败: {}", 
            authentication.getName(), event.getException().getMessage());
        
        // 记录失败日志
        auditService.recordLoginFailure(authentication.getName(), event.getException());
    }
    
    @EventListener
    public void handleAuthorizationFailure(AuthorizationFailureEvent event) {
        logger.warn("授权失败: 用户 {} 尝试访问 {} 被拒绝", 
            event.getAuthentication().getName(), 
            event.getAccessDeniedException().getMessage());
        
        // 发送安全警报
        alertService.sendSecurityAlert(event);
    }
}
```

### 6.2 安全配置最佳实践

```java
// 生产环境安全配置
@Configuration
@EnableWebSecurity
@Profile("prod")
public class ProductionSecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. 基本安全配置
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/**").hasRole("MONITOR")
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().denyAll()
            )
            // 2. CSRF保护
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/public/**", "/webhook/**")
            )
            // 3. 会话管理
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(1)
                .maxSessionsPreventsLogin(false)
            )
            // 4. 安全头配置
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline'")
                )
                .frameOptions().deny()
            )
            // 5. HTTP安全配置
            .httpBasic(Customizer.withDefaults())
            // 6. 异常处理
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                .accessDeniedHandler(new HttpStatusEntryPoint(HttpStatus.FORBIDDEN))
            );
            
        return http.build();
    }
    
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
            .requestMatchers("/css/**", "/js/**", "/images/**", "/webjars/**");
    }
}
```

### 6.3 性能优化与缓存

```java
// 安全缓存配置
@Configuration
@EnableCaching
public class SecurityCacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("userDetails", "permissions");
    }
    
    @Bean
    public UserDetailsService cachedUserDetailsService(UserDetailsService userDetailsService) {
        return new CachingUserDetailsService(userDetailsService);
    }
}

// 缓存用户详情服务
public class CachingUserDetailsService implements UserDetailsService {
    
    private final UserDetailsService delegate;
    private final Cache userCache;
    
    public CachingUserDetailsService(UserDetailsService delegate) {
        this.delegate = delegate;
        this.userCache = new ConcurrentMapCache("userDetails");
    }
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 先从缓存中获取
        Cache.ValueWrapper wrapper = userCache.get(username);
        if (wrapper != null) {
            return (UserDetails) wrapper.get();
        }
        
        // 缓存中没有，从委托服务加载
        UserDetails userDetails = delegate.loadUserByUsername(username);
        
        // 放入缓存
        userCache.put(username, userDetails);
        
        return userDetails;
    }
}
```

## 7. 总结

Spring Security是一个功能强大、高度可配置的安全框架，为企业级应用提供了全面的安全保护。通过深入理解其核心概念、架构设计和各种认证授权机制，开发者可以构建出安全、可靠的应用系统。

### 关键要点：

1. **认证与授权分离**：清晰区分身份验证和权限控制
2. **过滤器链设计**：理解安全过滤器的工作流程和顺序
3. **多种认证方式**：支持表单、JWT、OAuth2等多种认证机制
4. **灵活的授权策略**：支持URL级别和方法级别的细粒度授权控制
5. **安全事件监听**：通过事件机制实现安全监控和审计
6. **性能优化**：合理使用缓存提升安全性能

在实际应用中，建议根据具体业务需求选择合适的安全策略，并遵循"最小权限原则"和"深度防御"的安全理念，构建多层次的安全防护体系。