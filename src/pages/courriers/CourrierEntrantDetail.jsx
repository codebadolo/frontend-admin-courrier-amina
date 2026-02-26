// src/pages/courriers/CourrierEntrantDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Descriptions, Tag, Card, Row, Col, Spin, Timeline,
  Button, Space, Divider, List, Avatar, Badge, 
  Table, Progress, Typography, Alert, Tooltip, Tabs, Breadcrumb,
  Statistic, Steps, Modal, message, Input, Collapse
} from "antd";
import {
  EyeOutlined, DownloadOutlined, FileOutlined, ClockCircleOutlined,
  UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined,
  SafetyOutlined, AlertOutlined, CalendarOutlined, TeamOutlined,
  HistoryOutlined, PaperClipOutlined, CheckCircleOutlined,
  FileTextOutlined, QrcodeOutlined, ArrowLeftOutlined,
  HomeOutlined, AppstoreOutlined, InfoCircleOutlined, PrinterOutlined,
  ShareAltOutlined, CopyOutlined, EditOutlined, DeleteOutlined,
  SettingOutlined, DatabaseOutlined, NumberOutlined, 
  CopyOutlined as CopyIcon, InfoOutlined, FilePdfOutlined,
  FileImageOutlined, FileWordOutlined, FileExcelOutlined,
  ToolOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/fr";
import { 
  getCourrierDetail, 
  getPiecesJointes, 
  downloadPieceJointe 
} from "../../services/courrierService";
import { traitementSerice } from "../../services/traitementService";
import AffectationMembreModal from "../chefServices/AffectationMembreModal";

dayjs.extend(relativeTime);
dayjs.locale('fr');

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const CourrierEntrantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courrier, setCourrier] = useState(null);
  const [piecesJointes, setPiecesJointes] = useState([]);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [showAffectationModal, setShowAffectationModal] = useState(false);
  const [courrierInfo, setCourrierInfo] = useState(null);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

  // Extraire l'ID numérique
  const extractNumericId = (idParam) => {
    if (!idParam) return null;
    if (!isNaN(idParam) && !isNaN(parseInt(idParam))) return parseInt(idParam);
    const matches = idParam.match(/\d+/);
    return matches ? parseInt(matches[0]) : null;
  };

  const numericId = extractNumericId(id);

  useEffect(() => {
    if (numericId) loadCourrierDetail();
    else {
      setLoading(false);
      setCourrier(null);
    }
  }, [numericId]);

  const loadCourrierDetail = async () => {
    if (!numericId) {
      message.error("ID du courrier invalide");
      return;
    }
    setLoading(true);
    try {
      const courrierData = await getCourrierDetail(numericId);
      setCourrier(courrierData);

      if (courrierData.pieces_jointes?.length) {
        setPiecesJointes(courrierData.pieces_jointes);
      } else {
        try {
          const pieces = await getPiecesJointes(numericId);
          setPiecesJointes(pieces);
        } catch (pieceError) {
          console.warn("Erreur chargement pièces jointes:", pieceError);
        }
      }

      // Mettre à jour le rôle si nécessaire
      const role = localStorage.getItem('userRole');
      if (role) setUserRole(role);
      
    } catch (error) {
      console.error("Erreur détaillée:", error);
      if (error.response?.status === 404) {
        message.error(`Courrier avec l'ID ${numericId} non trouvé`);
      } else if (error.response?.status === 401) {
        message.error("Session expirée. Veuillez vous reconnecter.");
        navigate("/login");
      } else if (error.response?.status === 403) {
        message.error("Vous n'avez pas les permissions pour voir ce courrier");
      } else {
        message.error("Erreur lors du chargement des détails");
      }
      setCourrier(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPiece = async (piece) => {
    try {
      const blob = await downloadPieceJointe(piece.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = piece.fichier_nom || 'piece-jointe';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      message.success("Téléchargement démarré");
    } catch (error) {
      message.error("Erreur lors du téléchargement");
    }
  };

  const getPrioriteColor = (priorite) => {
    const colors = { urgente: 'red', haute: 'orange', normale: 'blue', basse: 'gray' };
    return colors[priorite?.toLowerCase()] || 'blue';
  };

  const getStatutColor = (statut) => {
    const colors = { recu: 'blue', impute: 'orange', traitement: 'gold', repondu: 'green', archive: 'gray' };
    return colors[statut] || 'blue';
  };

  const isChef = () => {
    return userRole === 'chef';
  };

  const shareUrl = `${window.location.origin}/detail-courrier/${id}`;

  const qrValue = JSON.stringify({
    id: courrier?.id,
    reference: courrier?.reference,
    url: shareUrl,
    objet: courrier?.objet,
    date: courrier?.date_reception
  });

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Courrier: ${courrier?.reference}`,
          text: `Consultez le courrier ${courrier?.objet}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Erreur de partage:', err);
      }
    } else {
      setShareModalVisible(true);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'jpg': case 'jpeg': case 'png': case 'gif': return <FileImageOutlined style={{ color: '#52c41a' }} />;
      case 'doc': case 'docx': return <FileWordOutlined style={{ color: '#1890ff' }} />;
      case 'xls': case 'xlsx': return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      default: return <FileOutlined />;
    }
  };

  const checkCanTreat = (courrier) => {
    const userRole = localStorage.getItem('userRole');
    const userId = parseInt(localStorage.getItem('userId'));
    const allowedRoles = ['agent_service', 'collaborateur', 'chef', 'direction', 'admin'];
    
    if (!allowedRoles.includes(userRole)) return false;
    if (!courrier) return false;
    
    // Si le courrier a un responsable, seul ce responsable peut le traiter
    if (courrier.responsable_actuel_detail?.id && courrier.responsable_actuel_detail.id !== userId) {
      return false;
    }
    
    const allowedStatuses = ['recu', 'impute', 'traitement'];
    return allowedStatuses.includes(courrier?.statut);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Space direction="vertical" align="center">
        <Spin size="large" />
        <Text type="secondary">Chargement des détails du courrier...</Text>
      </Space>
    </div>
  );

  if (!courrier) return (
    <div style={{ padding: '20px' }}>
      <Alert
        message="Courrier non trouvé"
        description="Le courrier demandé n'existe pas ou vous n'avez pas les droits pour y accéder."
        type="error"
        showIcon
        action={<Button type="primary" onClick={() => navigate('/courriers-entrants')}>Retour à la liste</Button>}
      />
    </div>
  );

  return (
    <div style={{ padding: '20px 24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <Breadcrumb
        style={{ margin: '0 0 20px 0' }}
        items={[
          { title: <Space><HomeOutlined /> Accueil</Space>, onClick: () => navigate('/') },
          { title: <Space><AppstoreOutlined /> Courriers entrants</Space>, onClick: () => navigate('/courriers-entrants') },
          { title: <Space><FileTextOutlined /> {courrier.reference || 'Détails'}</Space> },
        ]}
      />

      {/* Card principal */}
      <Card style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} bodyStyle={{ padding: '24px' }}>
        <Row gutter={24} align="middle">
          <Col span={18}>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space wrap>
                <Tag color="blue" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  <NumberOutlined /> {courrier.reference}
                </Tag>
                <Tag color={getPrioriteColor(courrier.priorite)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                  <AlertOutlined /> {courrier.priorite?.toUpperCase() || 'NORMALE'}
                </Tag>
                <Tag color={getStatutColor(courrier.statut)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                  <CheckCircleOutlined /> {courrier.statut_display || courrier.statut}
                </Tag>
                <Tag color="purple" style={{ fontSize: '12px', padding: '4px 8px' }}>
                  <SafetyOutlined /> {courrier.confidentialite || 'Normale'}
                </Tag>
              </Space>

              <Title level={2} style={{ margin: 0, color: '#1d1d1d' }}>
                {courrier.objet}
              </Title>

              {/* Infos principales */}
              <Row gutter={24}>
                <Col span={8}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Expéditeur</Text>
                    <Space>
                      <UserOutlined style={{ color: '#666' }} />
                      <Text strong style={{ fontSize: '14px' }}>{courrier.expediteur_nom}</Text>
                    </Space>
                    {courrier.expediteur_email && <Text type="secondary" style={{ fontSize: '12px', marginLeft: '24px' }}>{courrier.expediteur_email}</Text>}
                  </Space>
                </Col>

                <Col span={8}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Date de réception</Text>
                    <Space>
                      <CalendarOutlined style={{ color: '#666' }} />
                      <Text strong style={{ fontSize: '14px' }}>{dayjs(courrier.date_reception).format('DD/MM/YYYY HH:mm')}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: '12px', marginLeft: '24px' }}>({dayjs(courrier.date_reception).fromNow()})</Text>
                  </Space>
                </Col>

                <Col span={8}>
                  <Space direction="vertical" size={2}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Service imputé</Text>
                    <Space>
                      <TeamOutlined style={{ color: '#666' }} />
                      <Text strong style={{ fontSize: '14px' }}>{courrier.service_impute_detail?.nom || 'Non attribué'}</Text>
                    </Space>
                    {courrier.responsable_actuel_detail && <Text type="secondary" style={{ fontSize: '12px', marginLeft: '24px' }}>Responsable: {courrier.responsable_actuel_detail.prenom} {courrier.responsable_actuel_detail.nom}</Text>}
                  </Space>
                </Col>
              </Row>
            </Space>
          </Col>

          {/* Boutons d'action */}
          <Col span={6}>
            <Space direction="vertical" align="end" style={{ width: '100%' }}>
              <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                  Retour
                </Button>
                
                {/* Bouton Traiter - pour agents et collaborateurs */}
                {checkCanTreat(courrier) && 
                  <Button 
                    type="primary" 
                    icon={<ToolOutlined />} 
                    onClick={() => navigate(`/traitement/courriers/${numericId}`)} 
                    style={{ backgroundColor: '#1890ff', borderColor: '#1890ff', fontWeight: 'bold' }}
                  >
                    Traiter ce courrier
                  </Button>
                }
                
                {/* Bouton Affecter - pour les chefs UNIQUEMENT - VERSION CORRIGÉE */}
                {userRole === 'chef' && courrier?.service_actuel && (
                  <Button 
                    type="primary" 
                    icon={<TeamOutlined />}
                    onClick={() => {
                      console.log("Ouverture du modal d'affectation", courrier);
                      setCourrierInfo({
                        id: courrier.id,
                        reference: courrier.reference,
                        objet: courrier.objet,
                        priorite: courrier.priorite,
                        date_echeance: courrier.date_echeance
                      });
                      setShowAffectationModal(true);
                    }}
                    style={{ backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
                  >
                    Affecter à un membre
                  </Button>
                )}
                
                <Button type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
                  Imprimer
                </Button>
              </Space>

              <Space wrap style={{ marginTop: '16px' }}>
                <Tooltip title="Partager">
                  <Button icon={<ShareAltOutlined />} onClick={handleShare} shape="circle" />
                </Tooltip>
                <Tooltip title="Générer QR Code">
                  <Button icon={<QrcodeOutlined />} onClick={() => setQrModalVisible(true)} shape="circle" />
                </Tooltip>
                <Tooltip title="Éditer">
                  <Button icon={<EditOutlined />} onClick={() => navigate(`/courriers-entrants/edit/${id}`)} shape="circle" />
                </Tooltip>
                <Tooltip title="Supprimer">
                  <Button icon={<DeleteOutlined />} danger onClick={() => {
                    Modal.confirm({
                      title: 'Supprimer le courrier?',
                      content: 'Cette action est irréversible.',
                      okText: 'Supprimer',
                      cancelText: 'Annuler',
                      okType: 'danger',
                      onOk: () => message.info('Suppression à implémenter')
                    });
                  }} shape="circle" />
                </Tooltip>
              </Space>
            </Space>
          </Col>
        </Row>

        {/* Agent assigné (si présent) */}
        {courrier.responsable_actuel_detail && (
          <div style={{ 
            backgroundColor: '#e6f7ff', 
            borderRadius: '8px', 
            padding: '16px', 
            marginTop: '16px',
            border: '1px solid #91d5ff'
          }}>
            <Space align="center" size="large">
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <div>
                <Text strong style={{ color: '#0050b3' }}>Courrier assigné à</Text>
                <div>
                  <Text>{courrier.responsable_actuel_detail.prenom} {courrier.responsable_actuel_detail.nom}</Text>
                  <Tag color="blue" style={{ marginLeft: '8px' }}>
                    {courrier.responsable_actuel_detail.role === 'agent_service' ? 'Agent service' : 'Collaborateur'}
                  </Tag>
                </div>
                {courrier.date_echeance && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <ClockCircleOutlined /> À traiter avant le {dayjs(courrier.date_echeance).format('DD/MM/YYYY')}
                  </Text>
                )}
              </div>
            </Space>
          </div>
        )}
      </Card>

      {/* CONTENU DU COURRIER */}
      {courrier.contenu_texte && (
        <div style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '24px', marginBottom: '24px', border: '1px solid #f0f0f0' }}>
          <Title level={4}><FileTextOutlined /> Contenu du courrier</Title>
          <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #f0f0f0', maxHeight: '300px', overflowY: 'auto' }}>
            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.6' }}>{courrier.contenu_texte}</Paragraph>
          </div>
        </div>
      )}

      {/* PIÈCES JOINTES */}
      {piecesJointes.length > 0 && (
        <div style={{ backgroundColor: '#fafafa', borderRadius: '8px', padding: '24px', marginBottom: '24px', border: '1px solid #f0f0f0' }}>
          <Title level={4}><PaperClipOutlined /> Pièces jointes ({piecesJointes.length})</Title>
          <List
            dataSource={piecesJointes}
            renderItem={(piece) => (
              <List.Item style={{ padding: '12px', backgroundColor: '#fff', marginBottom: '8px', borderRadius: '6px', border: '1px solid #f0f0f0' }}
                actions={[
                  <Button key="view" icon={<EyeOutlined />} size="small" onClick={() => window.open(piece.fichier, '_blank')}>Voir</Button>,
                  <Button key="download" icon={<DownloadOutlined />} size="small" onClick={() => handleDownloadPiece(piece)}>Télécharger</Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={getFileIcon(piece.fichier_nom)} />}
                  title={piece.fichier_nom || piece.fichier?.split('/').pop()}
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary">Taille: {(piece.fichier_taille / 1024).toFixed(1)} KB</Text>
                      {piece.description && <Text type="secondary">{piece.description}</Text>}
                      {piece.date_upload && <Text type="secondary" style={{ fontSize: '12px' }}>Uploadé le {dayjs(piece.date_upload).format('DD/MM/YYYY HH:mm')}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* MODAL QR CODE */}
      <Modal title={<Space><QrcodeOutlined /> QR Code du courrier</Space>} open={qrModalVisible} onCancel={() => setQrModalVisible(false)} footer={null} width={400}>
        <Space direction="vertical" align="center" style={{ width: '100%', padding: '20px' }}>
          <QRCodeSVG value={qrValue} size={250} />
          <Space direction="vertical" align="center" style={{ marginTop: '20px' }}>
            <Text strong>{courrier.reference}</Text>
            <Text type="secondary">{courrier.objet}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{dayjs(courrier.date_reception).format('DD/MM/YYYY')}</Text>
          </Space>
        </Space>
      </Modal>

      {/* MODAL PARTAGE */}
      <Modal
        title={<Space><ShareAltOutlined /> Partager le courrier</Space>}
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text copyable={{ text: shareUrl }}>Copier le lien: {shareUrl}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>Lien utilisable pour partager le courrier</Text>
        </Space>
      </Modal>

      {/* Modal d'affectation */}
      <AffectationMembreModal
        visible={showAffectationModal}
        onCancel={() => setShowAffectationModal(false)}
        courrierId={numericId}
        courrierInfo={courrierInfo}
        onSuccess={() => {
          message.success("Courrier affecté avec succès");
          setShowAffectationModal(false);
          loadCourrierDetail(); // Recharger les détails pour voir l'assignation
        }}
      />
    </div>
  );
};

export default CourrierEntrantDetail;