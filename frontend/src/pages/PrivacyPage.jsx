import { Container, Typography, Box, Divider } from '@mui/material';

export default function PrivacyPage() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        개인정보처리방침
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        시행일: 2025년 1월 1일 &nbsp;|&nbsp; 최종 수정일: 2025년 1월 1일
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Section title="1. 개인정보의 수집 항목 및 수집 방법">
        <Typography variant="body1" paragraph>
          TripLog(이하 "서비스")는 카카오 소셜 로그인을 통해 아래 항목을 수집합니다.
        </Typography>
        <ul>
          <li>이메일 주소</li>
          <li>닉네임</li>
        </ul>
        <Typography variant="body1" sx={{ mt: 1 }}>
          수집 방법: 카카오 OAuth2 인증을 통한 자동 수집
        </Typography>
      </Section>

      <Section title="2. 개인정보의 수집 및 이용 목적">
        <ul>
          <li>회원 가입 및 서비스 로그인</li>
          <li>사용자 식별 및 서비스 제공</li>
          <li>여행 기록 저장 및 관리</li>
        </ul>
      </Section>

      <Section title="3. 개인정보의 보유 및 이용 기간">
        <Typography variant="body1">
          회원 탈퇴 시 즉시 삭제합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </Typography>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <Typography variant="body1">
          서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 이용자가 사전에 동의한 경우 또는 법령에 의한 경우는 예외입니다.
        </Typography>
      </Section>

      <Section title="5. 개인정보의 파기">
        <Typography variant="body1">
          수집 목적이 달성되거나 보유 기간이 만료된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구 불가능한 방법으로 영구 삭제합니다.
        </Typography>
      </Section>

      <Section title="6. 이용자의 권리">
        <Typography variant="body1" paragraph>
          이용자는 언제든지 아래 권리를 행사할 수 있습니다.
        </Typography>
        <ul>
          <li>개인정보 열람 요청</li>
          <li>개인정보 수정 요청</li>
          <li>회원 탈퇴(개인정보 삭제) 요청</li>
        </ul>
      </Section>

      <Section title="7. 개인정보 보호책임자">
        <Typography variant="body1">
          이메일: <a href="mailto:e990727@gmail.com">e990727@gmail.com</a>
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>
          개인정보 처리에 관한 문의는 위 이메일로 연락주시기 바랍니다.
        </Typography>
      </Section>

      <Section title="8. 개인정보처리방침 변경">
        <Typography variant="body1">
          이 개인정보처리방침은 법령·정책 변경에 따라 수정될 수 있으며, 변경 시 서비스 내 공지를 통해 안내합니다.
        </Typography>
      </Section>
    </Container>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
