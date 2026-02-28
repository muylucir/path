"use client";

import Popover from "@cloudscape-design/components/popover";
import Box from "@cloudscape-design/components/box";
import { GLOSSARY } from "@/lib/constants";

type GlossaryKey = keyof typeof GLOSSARY;

interface GlossaryTermByKeyProps {
  glossaryKey: GlossaryKey;
  term?: never;
  description?: never;
}

interface GlossaryTermDirectProps {
  glossaryKey?: never;
  term: string;
  description: string;
}

type GlossaryTermProps = GlossaryTermByKeyProps | GlossaryTermDirectProps;

export function GlossaryTerm(props: GlossaryTermProps) {
  const term = props.glossaryKey ? GLOSSARY[props.glossaryKey].term : props.term;
  const description = props.glossaryKey ? GLOSSARY[props.glossaryKey].description : props.description;

  return (
    <Popover
      dismissButton={false}
      position="top"
      size="small"
      triggerType="text"
      content={<Box variant="small">{description}</Box>}
    >
      <span style={{ borderBottom: "1px dashed currentColor", cursor: "help" }}>{term}</span>
    </Popover>
  );
}
