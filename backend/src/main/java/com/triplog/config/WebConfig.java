package com.triplog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 이미지는 Cloudinary에 저장되므로 로컬 /uploads 핸들러가 불필요합니다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
}
