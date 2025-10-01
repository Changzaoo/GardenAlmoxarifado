import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { lgpdService } from '../services/lgpdService';
import { auditService } from '../services/auditService';
import { legalDocumentService } from '../services/legalDocumentService';
import { LGPD_PURPOSES } from '../constants/lgpd';
import { notifyNewLoan } from '../utils/notificationHelpers';

export const initializeWorkflow = async (usuario) => {
  if (!usuario) return;

  // Verify or create LGPD consent
  const consent = await lgpdService.getConsentStatus(usuario.id);
  if (!consent) {
    await lgpdService.registerConsent(usuario.id, [
      LGPD_PURPOSES.INVENTORY_MANAGEMENT,
      LGPD_PURPOSES.EMPLOYEE_TRACKING,
      LGPD_PURPOSES.TOOL_LENDING
    ]);
  }

  // Log system access
  await auditService.logOperation({
    userId: usuario.id,
    operation: 'system_access',
    category: 'authentication',
    details: 'User logged into the system',
    ipAddress: await legalDocumentService.getClientIP()
  });
};

export const createLoanWithAudit = async (emprestimo, usuario) => {
  const timestamp = new Date().toISOString();
  
  // Create responsibility term
  const termId = await legalDocumentService.createTermOfResponsibility(
    usuario.id,
    emprestimo.ferramentas,
    emprestimo.dataPrevistaDevolucao
  );

  // Create loan with additional tracking
  const emprestimoWithTracking = {
    ...emprestimo,
    termId,
    audit: {
      createdBy: usuario.id,
      createdAt: timestamp,
      ipAddress: await legalDocumentService.getClientIP(),
      userAgent: navigator.userAgent
    }
  };

  const docRef = await addDoc(collection(db, 'emprestimos'), emprestimoWithTracking);

  // Criar notificação para o responsável pelo empréstimo
  try {
    await notifyNewLoan(
      emprestimo.responsavel,
      emprestimo.ferramentas.map(f => f.nome),
      emprestimo.responsavel,
      { id: docRef.id, ...emprestimoWithTracking }
    );
  } catch (notificationError) {
    console.error('Erro ao criar notificação do empréstimo:', notificationError);
    // Não bloqueia a criação do empréstimo mesmo se a notificação falhar
  }

  // Log the operation
  await auditService.logOperation({
    userId: usuario.id,
    operation: 'create_loan',
    category: 'loan_management',
    details: 'New loan created',
    affectedItems: emprestimo.ferramentas.map(f => f.id),
    ipAddress: await legalDocumentService.getClientIP()
  });

  return docRef;
};

export const returnToolsWithAudit = async (emprestimoId, usuario) => {
  const timestamp = new Date().toISOString();
  const emprestimoRef = doc(db, 'emprestimos', emprestimoId);

  await updateDoc(emprestimoRef, {
    status: 'devolvido',
    dataDevolucao: timestamp,
    audit: {
      returnedBy: usuario.id,
      returnedAt: timestamp,
      ipAddress: await legalDocumentService.getClientIP(),
      userAgent: navigator.userAgent
    }
  });

  // Log the operation
  await auditService.logOperation({
    userId: usuario.id,
    operation: 'return_tools',
    category: 'loan_management',
    details: 'Tools returned to inventory',
    affectedItems: [emprestimoId],
    ipAddress: await legalDocumentService.getClientIP()
  });
};

export const transferToolsWithAudit = async (transferencia, usuario) => {
  const timestamp = new Date().toISOString();

  // Create new responsibility term for the receiving employee
  const termId = await legalDocumentService.createTermOfResponsibility(
    transferencia.funcionarioDestinoId,
    transferencia.ferramentas,
    transferencia.dataPrevistaDevolucao
  );

  const transferenciaWithTracking = {
    ...transferencia,
    termId,
    audit: {
      transferredBy: usuario.id,
      transferredAt: timestamp,
      ipAddress: await legalDocumentService.getClientIP(),
      userAgent: navigator.userAgent
    }
  };

  const docRef = await addDoc(collection(db, 'transferencias'), transferenciaWithTracking);

  // Log the operation
  await auditService.logOperation({
    userId: usuario.id,
    operation: 'transfer_tools',
    category: 'tool_management',
    details: 'Tools transferred between employees',
    affectedItems: transferencia.ferramentas.map(f => f.id),
    ipAddress: await legalDocumentService.getClientIP()
  });

  return docRef;
};
