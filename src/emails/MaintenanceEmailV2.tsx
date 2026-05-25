import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { SiteCheckData, MaintenanceTask } from "@/types";

interface MaintenanceEmailV2Props {
  clientName: string;
  clientUrl: string;
  siteInfo: SiteCheckData | null;
  completedTasks: MaintenanceTask[];
  pendingTasks: MaintenanceTask[];
  notes: string;
  reportDate: Date;
}

export const MaintenanceEmailV2 = ({
  clientName,
  clientUrl,
  siteInfo,
  completedTasks,
  pendingTasks,
  notes,
  reportDate,
}: MaintenanceEmailV2Props) => {
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

          {siteInfo && (
            <Section style={siteInfoSection}>
              <Heading style={h2}>Información del Sitio</Heading>
              <Row>
                <Column style={infoCard}>
                  <Text style={infoLabel}>Nombre</Text>
                  <Text style={infoValue}>{siteInfo.siteName}</Text>
                </Column>
                <Column style={infoCard}>
                  <Text style={infoLabel}>Versión WP</Text>
                  <Text style={infoValue}>{siteInfo.wpVersion}</Text>
                </Column>
                <Column style={infoCard}>
                  <Text style={infoLabel}>Estado</Text>
                  <Text
                    style={{
                      ...infoValue,
                      color: siteInfo.isReachable ? "#2e7d32" : "#c62828",
                    }}
                  >
                    {siteInfo.isReachable ? "✓ Online" : "✗ Error"}
                  </Text>
                </Column>
              </Row>
            </Section>
          )}

          <Section style={summarySection}>
            <Row>
              <Column style={{ ...summaryCard, background: "#e8f5e9" }}>
                <Text style={summaryNumber}>{completedTasks.length}</Text>
                <Text style={summaryLabel}>Tareas Completadas</Text>
              </Column>
              <Column
                style={{
                  ...summaryCard,
                  background: pendingTasks.length > 0 ? "#fff3e0" : "#f5f5f5",
                }}
              >
                <Text style={summaryNumber}>{pendingTasks.length}</Text>
                <Text style={summaryLabel}>Pendientes</Text>
              </Column>
            </Row>
          </Section>

          {completedTasks.length > 0 && (
            <Section style={pluginsSection}>
              <Heading style={h2}>
                <span style={{ color: "#2e7d32" }}>✓</span> Tareas Realizadas
              </Heading>
              <Text style={sectionDesc}>
                Estas tareas han sido completadas en este mantenimiento:
              </Text>
              {completedTasks.map((task, index) => (
                <div key={index} style={taskItem}>
                  <div style={taskCheck} />
                  <Text style={taskName}>{task.label}</Text>
                </div>
              ))}
            </Section>
          )}

          {pendingTasks.length > 0 && (
            <Section style={pluginsSection}>
              <Heading style={h2}>
                <span style={{ color: "#ef6c00" }}>⏳</span> Tareas Pendientes
              </Heading>
              <Text style={sectionDesc}>
                Estas tareas quedan pendientes para la próxima revisión:
              </Text>
              {pendingTasks.map((task, index) => (
                <div key={index} style={taskItemPending}>
                  <div style={taskCircle} />
                  <Text style={taskNamePending}>{task.label}</Text>
                </div>
              ))}
            </Section>
          )}

          {notes && notes.trim().length > 0 && (
            <Section style={notesSection}>
              <Heading style={h2}>
                <span style={{ color: "#1565c0" }}>📝</span> Notas Adicionales
              </Heading>
              <div style={notesBox}>
                <Text style={notesText}>{notes}</Text>
              </div>
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

export default MaintenanceEmailV2;

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

const siteInfoSection = {
  background: "#ffffff",
  padding: "24px 40px 0",
};

const infoCard = {
  borderRadius: "10px",
  padding: "16px",
  background: "#fafafa",
};

const infoLabel = {
  color: "#a0a09a",
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const infoValue = {
  color: "#1a1a1f",
  fontSize: "14px",
  fontWeight: 600,
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

const taskItem = {
  display: "flex" as const,
  alignItems: "center" as const,
  gap: "12px",
  background: "#e8f5e9",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "8px",
};

const taskItemPending = {
  display: "flex" as const,
  alignItems: "center" as const,
  gap: "12px",
  background: "#fff8e1",
  borderRadius: "8px",
  padding: "12px 16px",
  marginBottom: "8px",
};

const taskCheck = {
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#2e7d32",
  display: "flex" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  flexShrink: 0,
};

const taskCircle = {
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  border: "2px solid #f57c00",
  flexShrink: 0,
};

const taskName = {
  color: "#1a1a1f",
  fontSize: "14px",
  fontWeight: 500,
  margin: 0,
};

const taskNamePending = {
  color: "#5d4037",
  fontSize: "14px",
  fontWeight: 500,
  margin: 0,
};

const notesSection = {
  background: "#ffffff",
  padding: "0 40px 16px",
};

const notesBox = {
  background: "#f5f7fa",
  borderRadius: "10px",
  padding: "16px 20px",
  borderLeft: "3px solid #1565c0",
};

const notesText = {
  color: "#424242",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
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
