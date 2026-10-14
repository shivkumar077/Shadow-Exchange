package com.shadowexchange.repository;

import com.shadowexchange.entity.AuthProvider;
import com.shadowexchange.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByAuthProviderAndProviderSubjectId(AuthProvider authProvider, String providerSubjectId);

    Optional<User> findByProviderSubjectId(String providerSubjectId);

    Optional<User> findByEmail(String email);
}
