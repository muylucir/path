import Spinner from "@cloudscape-design/components/spinner";
import Box from "@cloudscape-design/components/box";

export default function Loading() {
  return (
    <Box textAlign="center" padding={{ vertical: "xxxl" }}>
      <Spinner size="large" />
      <Box variant="p" color="text-body-secondary" margin={{ top: "s" }}>
        페이지를 불러오는 중...
      </Box>
    </Box>
  );
}
