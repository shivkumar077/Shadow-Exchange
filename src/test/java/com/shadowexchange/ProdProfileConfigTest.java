package com.shadowexchange;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.core.env.StandardEnvironment;
import org.springframework.core.io.DefaultResourceLoader;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Offline configuration verification tests.
 *
 * NOTE: These tests verify Spring Boot profile resolution and DataSourceProperties
 * binding offline. They DO NOT make live database network calls and MUST NEVER
 * depend on real database credentials.
 */
class ProdProfileConfigTest {

    @Test
    @DisplayName("Verify PostgreSQL JDBC driver class is available on classpath")
    void postgresDriverClassIsPresentOnClasspath() throws ClassNotFoundException {
        Class<?> driverClass = Class.forName("org.postgresql.Driver");
        assertThat(driverClass).isNotNull();
    }

    @Test
    @DisplayName("Verify prod profile loads PostgreSQL driver and dialect into DataSourceProperties")
    void prodProfileLoadsPostgresConfigurationAndBindsDataSource() {
        StandardEnvironment environment = new StandardEnvironment();
        environment.setActiveProfiles("prod");

        // Supply synthetic mock placeholders so environment post-processing succeeds offline
        System.setProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://dev-db.mock.neon.tech/neondb");
        System.setProperty("SPRING_DATASOURCE_USERNAME", "mock_dev_user");
        System.setProperty("SPRING_DATASOURCE_PASSWORD", "mock_dev_password");

        try {
            ConfigDataEnvironmentPostProcessor.applyTo(
                    environment,
                    new DefaultResourceLoader(),
                    null,
                    "prod"
            );

            assertThat(environment.getProperty("spring.datasource.driver-class-name"))
                    .isEqualTo("org.postgresql.Driver");
            assertThat(environment.getProperty("spring.jpa.database-platform"))
                    .isEqualTo("org.hibernate.dialect.PostgreSQLDialect");
            assertThat(environment.getProperty("spring.jpa.show-sql"))
                    .isEqualTo("false");
            assertThat(environment.getProperty("spring.jpa.hibernate.ddl-auto"))
                    .isEqualTo("update");
            assertThat(environment.getProperty("server.forward-headers-strategy"))
                    .isEqualTo("framework");
            assertThat(environment.getProperty("server.servlet.session.cookie.same-site"))
                    .isEqualTo("lax");
            assertThat(environment.getProperty("server.servlet.session.cookie.secure"))
                    .isEqualTo("true");

            // Spring Boot DataSourceProperties binding verification
            DataSourceProperties properties = new DataSourceProperties();
            Binder.get(environment)
                    .bind("spring.datasource", Bindable.ofInstance(properties));

            assertThat(properties.determineDriverClassName())
                    .isEqualTo("org.postgresql.Driver");
            assertThat(properties.getDriverClassName())
                    .isEqualTo("org.postgresql.Driver");
        } finally {
            System.clearProperty("SPRING_DATASOURCE_URL");
            System.clearProperty("SPRING_DATASOURCE_USERNAME");
            System.clearProperty("SPRING_DATASOURCE_PASSWORD");
        }
    }

    @Test
    @DisplayName("Verify prod profile resolves environment-variable placeholders (offline, mock values only)")
    void prodProfileResolvesEnvironmentVariablePlaceholders() {
        StandardEnvironment environment = new StandardEnvironment();
        environment.setActiveProfiles("prod");

        final String mockUrl = "jdbc:postgresql://dev-db.mock.neon.tech/neondb";
        final String mockUser = "mock_dev_user";
        final String mockPassword = "mock_dev_password";

        System.setProperty("SPRING_DATASOURCE_URL", mockUrl);
        System.setProperty("SPRING_DATASOURCE_USERNAME", mockUser);
        System.setProperty("SPRING_DATASOURCE_PASSWORD", mockPassword);

        try {
            ConfigDataEnvironmentPostProcessor.applyTo(
                    environment,
                    new DefaultResourceLoader(),
                    null,
                    "prod"
            );

            // Verify property placeholder substitution
            assertThat(environment.getProperty("spring.datasource.url"))
                    .isEqualTo(mockUrl);
            assertThat(environment.getProperty("spring.datasource.username"))
                    .isEqualTo(mockUser);
            assertThat(environment.getProperty("spring.datasource.password"))
                    .isEqualTo(mockPassword);

            // Verify DataSourceProperties correctly receives interpolated values
            DataSourceProperties properties = new DataSourceProperties();
            Binder.get(environment)
                    .bind("spring.datasource", Bindable.ofInstance(properties));

            assertThat(properties.determineUrl()).isEqualTo(mockUrl);
            assertThat(properties.determineUsername()).isEqualTo(mockUser);
            assertThat(properties.determinePassword()).isEqualTo(mockPassword);
        } finally {
            System.clearProperty("SPRING_DATASOURCE_URL");
            System.clearProperty("SPRING_DATASOURCE_USERNAME");
            System.clearProperty("SPRING_DATASOURCE_PASSWORD");
        }
    }

    @Test
    @DisplayName("Verify default profile loads H2 configuration and binds H2 driver")
    void defaultProfileLoadsH2ConfigurationAndBindsDataSource() {
        StandardEnvironment environment = new StandardEnvironment();
        ConfigDataEnvironmentPostProcessor.applyTo(
                environment,
                new DefaultResourceLoader(),
                null,
                "default"
        );

        // Canonical property checks from application.properties
        assertThat(environment.getProperty("spring.datasource.driver-class-name"))
                .isEqualTo("org.h2.Driver");
        assertThat(environment.getProperty("spring.datasource.url"))
                .contains("jdbc:h2:mem:shadow_exchange");
        assertThat(environment.getProperty("spring.jpa.database-platform"))
                .isEqualTo("org.hibernate.dialect.H2Dialect");
        assertThat(environment.getProperty("spring.jpa.show-sql"))
                .isEqualTo("true");

        // Spring Boot DataSourceProperties binding verification
        DataSourceProperties properties = new DataSourceProperties();
        Binder.get(environment)
                .bind("spring.datasource", Bindable.ofInstance(properties));

        assertThat(properties.determineDriverClassName())
                .isEqualTo("org.h2.Driver");
        assertThat(properties.determineUrl())
                .contains("jdbc:h2:mem:shadow_exchange");
        assertThat(properties.determineUsername())
                .isEqualTo("sa");
    }

    @Test
    @DisplayName("Verify prod profile resolves Google OAuth and forwarded headers environment variables")
    void prodProfileResolvesGoogleOauthAndForwardedHeadersEnvironmentVariables() {
        StandardEnvironment environment = new StandardEnvironment();
        environment.setActiveProfiles("prod");

        System.setProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://mock:5432/db");
        System.setProperty("SPRING_DATASOURCE_USERNAME", "mock");
        System.setProperty("SPRING_DATASOURCE_PASSWORD", "mock");
        System.setProperty("GOOGLE_CLIENT_ID", "test-google-client-id-12345");
        System.setProperty("GOOGLE_CLIENT_SECRET", "test-google-client-secret-abcde");
        System.setProperty("APP_FRONTEND_URL", "https://custom-shadow-exchange.vercel.app");
        System.setProperty("SERVER_FORWARD_HEADERS_STRATEGY", "framework");

        try {
            ConfigDataEnvironmentPostProcessor.applyTo(
                    environment,
                    new DefaultResourceLoader(),
                    null,
                    "prod"
            );

            assertThat(environment.getProperty("spring.security.oauth2.client.registration.google.client-id"))
                    .isEqualTo("test-google-client-id-12345");
            assertThat(environment.getProperty("spring.security.oauth2.client.registration.google.client-secret"))
                    .isEqualTo("test-google-client-secret-abcde");
            assertThat(environment.getProperty("spring.security.oauth2.client.registration.google.redirect-uri"))
                    .isEqualTo("https://shadow-exchange-live.vercel.app/login/oauth2/code/google");
            assertThat(environment.getProperty("app.frontend-url"))
                    .isEqualTo("https://custom-shadow-exchange.vercel.app");
            assertThat(environment.getProperty("server.forward-headers-strategy"))
                    .isEqualTo("framework");
        } finally {
            System.clearProperty("SPRING_DATASOURCE_URL");
            System.clearProperty("SPRING_DATASOURCE_USERNAME");
            System.clearProperty("SPRING_DATASOURCE_PASSWORD");
            System.clearProperty("GOOGLE_CLIENT_ID");
            System.clearProperty("GOOGLE_CLIENT_SECRET");
            System.clearProperty("APP_FRONTEND_URL");
            System.clearProperty("SERVER_FORWARD_HEADERS_STRATEGY");
        }
    }

    @Test
    @DisplayName("Verify prod profile allows overriding Google redirect-uri via GOOGLE_REDIRECT_URI")
    void prodProfileAllowsOverridingGoogleRedirectUriViaEnvironmentVariable() {
        StandardEnvironment environment = new StandardEnvironment();
        environment.setActiveProfiles("prod");

        System.setProperty("SPRING_DATASOURCE_URL", "jdbc:postgresql://mock:5432/db");
        System.setProperty("SPRING_DATASOURCE_USERNAME", "mock");
        System.setProperty("SPRING_DATASOURCE_PASSWORD", "mock");
        System.setProperty("GOOGLE_REDIRECT_URI", "https://custom-domain.com/login/oauth2/code/google");

        try {
            ConfigDataEnvironmentPostProcessor.applyTo(
                    environment,
                    new DefaultResourceLoader(),
                    null,
                    "prod"
            );

            assertThat(environment.getProperty("spring.security.oauth2.client.registration.google.redirect-uri"))
                    .isEqualTo("https://custom-domain.com/login/oauth2/code/google");
        } finally {
            System.clearProperty("SPRING_DATASOURCE_URL");
            System.clearProperty("SPRING_DATASOURCE_USERNAME");
            System.clearProperty("SPRING_DATASOURCE_PASSWORD");
            System.clearProperty("GOOGLE_REDIRECT_URI");
        }
    }
}
