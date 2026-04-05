package com.triplog.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.triplog.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Cloudinary 기반 이미지 저장 서비스.
 * 환경변수 CLOUDINARY_URL (cloudinary://api_key:api_secret@cloud_name) 을 자동으로 읽습니다.
 */
@Slf4j
@Service
public class StorageService {

    private final Cloudinary cloudinary;

    public StorageService(@Value("${CLOUDINARY_URL:}") String cloudinaryUrl) {
        this.cloudinary = cloudinaryUrl.isBlank()
                ? new Cloudinary()           // 환경변수 CLOUDINARY_URL 자동 참조
                : new Cloudinary(cloudinaryUrl);
    }

    /**
     * 이미지를 Cloudinary에 업로드하고 secure URL을 반환합니다.
     */
    public String upload(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            throw CustomException.badRequest("File is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw CustomException.badRequest("Only image files are allowed");
        }

        try {
            @SuppressWarnings("rawtypes")
            Map result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "triplog/" + folder,
                            "resource_type", "image"
                    )
            );
            String url = (String) result.get("secure_url");
            log.info("Cloudinary upload success: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Cloudinary upload failed: {}", e.getMessage());
            throw CustomException.badRequest("이미지 업로드에 실패했습니다: " + e.getMessage());
        }
    }
}
