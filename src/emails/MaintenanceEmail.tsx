import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface MaintenanceEmailProps {
  clientName: string;
  clientUrl: string;
  updatedPlugins: Array<{ name: string; version: string; newVersion?: string }>;
  pendingPlugins: Array<{ name: string; version: string; newVersion?: string }>;
  reportDate: Date;
}

export const MaintenanceEmail = ({
  clientName,
  clientUrl,
  updatedPlugins,
  pendingPlugins,
  reportDate,
}: MaintenanceEmailProps) => {
  const formattedDate = reportDate.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html>
      <Head />
      <Preview>Informe de Mantenimiento Web - {formattedDate}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Row>
              <Column>
                <Heading style={h1}>Informe de Mantenimiento</Heading>
                <Text style={subtitle}>Web: {clientUrl}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={greetingSection}>
            <Text style={greeting}>Hola {clientName},</Text>
            <Text style={paragraph}>
              Hemos completado el mantenimiento mensual de tu sitio web. A continuación, el detalle de las tareas realizadas.
            </Text>
          </Section>

          <Section style={summarySection}>
            <Row>
              <Column style={{ ...summaryCard, background: "#e8f5e9" }}>
                <Text style={summaryNumber}>{updatedPlugins.length}</Text>
                <Text style={summaryLabel}>Plugins Actualizados</Text>
              </Column>
              <Column style={{ ...summaryCard, background: pendingPlugins.length > 0 ? "#fff3e0" : "#f5f5f5" }}>
                <Text style={summaryNumber}>{pendingPlugins.length}</Text>
                <Text style={summaryLabel}>Pendientes</Text>
              </Column>
            </Row>
          </Section>

          {updatedPlugins.length > 0 && (
            <Section style={pluginsSection}>
              <Heading style={h2}>
                <span style={{ color: "#2e7d32" }}>✓</span> Plugins Actualizados
              </Heading>
              <Text style={sectionDesc}>
                Estos plugins han sido actualizados a su última versión disponible:
              </Text>
              {updatedPlugins.map((plugin, index) => (
                <div key={index} style={pluginItem}>
                  <Text style={pluginName}>{plugin.name}</Text>
                  <Text style={pluginVersion}>
                    v{plugin.version}
                    {plugin.newVersion && (
                      <span style={pluginArrow}> → </span>
                    )}
                    {plugin.newVersion && (
                      <span style={pluginNewVersion}>v{plugin.newVersion}</span>
                    )}
                  </Text>
                </div>
              ))}
            </Section>
          )}

          {pendingPlugins.length > 0 && (
            <Section style={pluginsSection}>
              <Heading style={h2}>
                <span style={{ color: "#ef6c00" }}>⏳</span> Actualizaciones Pendientes
              </Heading>
              <Text style={sectionDesc}>
                Estas actualizaciones están disponibles pero se han pospuesto para esta revisión:
              </Text>
              {pendingPlugins.map((plugin, index) => (
                <div key={index} style={pluginItem}>
                  <Text style={pluginName}>{plugin.name}</Text>
                  <Text style={pluginVersion}>
                    v{plugin.version}
                    <span style={pluginArrow}> → </span>
                    <span style={pluginNewVersion}>v{plugin.newVersion || "Nueva versión"}</span>
                  </Text>
                </div>
              ))}
            </Section>
          )}

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Este informe fue generado automáticamente el {formattedDate}.
            </Text>
            <Text style={footerTextSmall}>
              Si tienes alguna duda sobre este mantenimiento, no dudes en contactarnos.
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} Mantenimiento Web Profesional
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default MaintenanceEmail;

const main = {
  backgroundColor: "#f5f5f5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0",
  maxWidth: "580px",
};

const header = {
  background: "linear-gradient(135deg, #1a1a1f 0%, #2d2d35 100%)",
  borderRadius: "16px 16px 0 0",
  padding: "32px 40px",
};

const h1 = {
  color: "#d4a853",
  fontSize: "24px",
  fontWeight: 600,
  margin: "0 0 4px 0",
};

const subtitle = {
  color: "#a0a09a",
  fontSize: "14px",
  margin: 0,
};

const greetingSection = {
  background: "#ffffff",
  padding: "32px 40px 0",
};

const greeting = {
  color: "#1a1a1f",
  fontSize: "18px",
  fontWeight: 600,
  margin: "0 0 12px",
};

const paragraph = {
  color: "#6b6b66",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: 0,
};

const summarySection = {
  background: "#ffffff",
  padding: "24px 40px",
};

const summaryCard = {
  borderRadius: "12px",
  padding: "20px",
  textAlign: "center" as const,
};

const summaryNumber = {
  color: "#1a1a1f",
  fontSize: "32px",
  fontWeight: 700,
  margin: "0 0 4px",
};

const summaryLabel = {
  color: "#6b6b66",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: 0,
};

const pluginsSection = {
  background: "#ffffff",
  padding: "0 40px 16px",
};

const h2 = {
  color: "#1a1a1f",
  fontSize: "16px",
  fontWeight: 600,
  margin: "0 0 8px",
};

const sectionDesc = {
  color: "#6b6b66",
  fontSize: "13px",
  margin: "0 0 16px",
};

const pluginItem = {
  background: "#fafafa",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "8px",
};

const pluginName = {
  color: "#1a1a1f",
  fontSize: "14px",
  fontWeight: 600,
  margin: "0 0 4px",
};

const pluginVersion = {
  color: "#6b6b66",
  fontSize: "12px",
  fontFamily: "monospace",
  margin: 0,
};

const pluginArrow = {
  color: "#d4a853",
  margin: "0 4px",
};

const pluginNewVersion = {
  color: "#2e7d32",
  fontWeight: 600,
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "0",
};

const footer = {
  background: "#ffffff",
  borderRadius: "0 0 16px 16px",
  padding: "24px 40px 32px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b6b66",
  fontSize: "12px",
  margin: "0 0 4px",
};

const footerTextSmall = {
  color: "#a0a09a",
  fontSize: "11px",
  margin: "0 0 16px",
};

const footerCopyright = {
  color: "#a0a09a",
  fontSize: "10px",
  margin: 0,
};
