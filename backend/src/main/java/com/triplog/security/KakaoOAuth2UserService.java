package com.triplog.security;

import com.triplog.entity.Provider;
import com.triplog.entity.User;
import com.triplog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2UserAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String providerId = String.valueOf(attributes.get("id"));

        @SuppressWarnings("unchecked")
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        if (kakaoAccount == null) {
            throw new OAuth2AuthenticationException(new OAuth2Error("missing_kakao_account"),
                    "카카오 계정 정보를 가져올 수 없습니다.");
        }

        String email = (String) kakaoAccount.get("email");
        if (email == null) {
            throw new OAuth2AuthenticationException(new OAuth2Error("missing_email"),
                    "카카오 계정의 이메일 제공에 동의가 필요합니다.");
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
        String nickname = profile != null ? (String) profile.get("nickname") : email.split("@")[0];

        User user = userRepository.findByEmail(email)
                .map(existing -> {
                    if (existing.getProvider() == Provider.LOCAL) {
                        throw new OAuth2AuthenticationException(new OAuth2Error("local_account_exists"),
                                "이미 일반 계정으로 가입된 이메일입니다. 이메일/비밀번호로 로그인해주세요.");
                    }
                    existing.setNickname(nickname);
                    return userRepository.save(existing);
                })
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .nickname(nickname)
                            .password("{noop}KAKAO_" + providerId)  // password NOT NULL 제약 대응
                            .provider(Provider.KAKAO)
                            .providerId(providerId)
                            .build();
                    return userRepository.save(newUser);
                });

        log.info("Kakao OAuth2 login: {}", email);

        Map<String, Object> modifiedAttributes = new HashMap<>(attributes);
        modifiedAttributes.put("email", email);
        modifiedAttributes.put("nickname", user.getNickname());
        modifiedAttributes.put("role", user.getRole().name());

        return new DefaultOAuth2User(
                Set.of(new OAuth2UserAuthority("ROLE_" + user.getRole().name(), modifiedAttributes)),
                modifiedAttributes,
                "email"
        );
    }
}
