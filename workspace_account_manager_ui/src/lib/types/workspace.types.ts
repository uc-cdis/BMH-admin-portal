export type WorkspaceType = 'Direct Pay' | 'STRIDES Grant' | 'STRIDES Credits';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'active';

export interface WorkspaceBase {
  bmh_workspace_id: string;
  request_status: RequestStatus;
  workspace_type: WorkspaceType;
  'total-usage': number;
  'soft-limit': number;
  'hard-limit': number;
}

export interface StridesWorkspace extends WorkspaceBase {
  nih_funded_award_number: string;
  'strides-credits': number | null;
  workspace_type: 'STRIDES Grant' | 'STRIDES Credits';
}

export interface DirectPayWorkspace extends WorkspaceBase {
  directpay_workspace_id: string;
  direct_pay_limit: number;
  workspace_type: 'Direct Pay';
}

export type Workspace = StridesWorkspace | DirectPayWorkspace;

export interface WorkspaceLimits {
  'soft-limit': number;
  'hard-limit': number;
}

export interface WorkspaceAPIResponse {
  workspaces: Workspace[];
}
