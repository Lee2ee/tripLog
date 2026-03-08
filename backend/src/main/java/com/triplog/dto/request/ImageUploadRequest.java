package com.triplog.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImageUploadRequest {
    // Multipart file is handled directly in the controller via MultipartFile parameter.
    // This class is kept for potential future metadata fields (e.g., caption, tags).
    private String caption;
}
