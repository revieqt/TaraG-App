import { BACKEND_URL } from "@/constants/Config";

export interface Group {
  id?: string;
  name: string;
  admins: string[];
  createdOn: any;
  updatedOn: any;
  itineraryID: string;
  chatID: string;
  inviteCode: string;
  members: GroupMember[];
}

export interface GroupMember {
  userID: string;
  username: string;
  name: string;
  profileImage: string;
  isApproved: boolean;
  joinedOn: any;
}

export interface CreateGroupRequest {
  groupName: string;
  userID: string;
  username: string;
  name: string;
  profileImage: string;
  itineraryID?: string;
}

export interface JoinGroupRequest {
  inviteCode: string;
  userID: string;
  username: string;
  name: string;
  profileImage: string;
}

export interface RespondJoinRequest {
  groupID: string;
  userID: string;
  adminID: string;
  response: boolean;
}

export interface PromoteUserRequest {
  groupID: string;
  userID: string;
  adminID: string;
}

export interface KickUserRequest {
  groupID: string;
  userID: string;
  adminID: string;
}

export interface LinkItineraryRequest {
  groupID: string;
  itineraryID: string;
  adminID: string;
}

export interface DeleteItineraryRequest {
  groupID: string;
  adminID: string;
}

export interface DeleteGroupRequest {
  groupID: string;
  adminID: string;
}

export interface ChangeGroupNameRequest {
  groupID: string;
  adminID: string;
  newName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

class GroupsApiService {
  private baseUrl = `${BACKEND_URL}/groups`;

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    accessToken: string,
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error (${method} ${endpoint}):`, error);
      throw error;
    }
  }

  async getGroups(accessToken: string, userID: string): Promise<Group[]> {
    const response = await this.makeRequest<Group[]>(
      '/get-groups',
      'POST',
      accessToken,
      { userID }
    );
    return response.data || [];
  }

  async getGroupData(accessToken: string, groupID: string): Promise<Group | null> {
    const response = await this.makeRequest<Group>(
      '/get-group-data',
      'POST',
      accessToken,
      { groupID }
    );
    return response.data || null;
  }

  async createGroup(
    accessToken: string,
    groupData: CreateGroupRequest
  ): Promise<{ groupId: string; inviteCode: string }> {
    const response = await this.makeRequest<{ groupId: string; inviteCode: string }>(
      '/create-group',
      'POST',
      accessToken,
      groupData
    );
    return response.data!;
  }

  async createGroupWithItinerary(
    accessToken: string,
    groupData: CreateGroupRequest & { itineraryID: string }
  ): Promise<{ groupId: string; inviteCode: string }> {
    const response = await this.makeRequest<{ groupId: string; inviteCode: string }>(
      '/create-group',
      'POST',
      accessToken,
      groupData
    );
    return response.data!;
  }

  async joinGroup(
    accessToken: string,
    joinData: JoinGroupRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/join-group',
      'POST',
      accessToken,
      joinData
    );
  }

  async respondJoinRequest(
    accessToken: string,
    requestData: RespondJoinRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/respond-join-request',
      'POST',
      accessToken,
      requestData
    );
  }

  async promoteUserToAdmin(
    accessToken: string,
    requestData: PromoteUserRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/promote-user',
      'POST',
      accessToken,
      requestData
    );
  }

  async kickUserFromGroup(
    accessToken: string,
    requestData: KickUserRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/kick-user',
      'POST',
      accessToken,
      requestData
    );
  }

  async leaveGroup(
    accessToken: string,
    requestData: KickUserRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/leave-group',
      'POST',
      accessToken,
      requestData
    );
  }

  async linkGroupItinerary(
    accessToken: string,
    requestData: LinkItineraryRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/link-itinerary',
      'POST',
      accessToken,
      requestData
    );
  }

  async deleteGroupItinerary(
    accessToken: string,
    requestData: DeleteItineraryRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/delete-itinerary',
      'POST',
      accessToken,
      requestData
    );
  }

  async deleteGroup(
    accessToken: string,
    requestData: DeleteGroupRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/delete-group',
      'POST',
      accessToken,
      requestData
    );
  }

  async changeGroupName(
    accessToken: string,
    requestData: ChangeGroupNameRequest
  ): Promise<void> {
    await this.makeRequest<void>(
      '/change-room-name',
      'POST',
      accessToken,
      requestData
    );
  }
}

export const groupsApiService = new GroupsApiService();
