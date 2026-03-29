package com.triplog.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class LocationReorderRequest {
    private List<Long> orderedIds; // 원하는 순서대로 정렬된 Location ID 목록
}
