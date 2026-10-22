import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request, { download } from '@/utils/request';
import type { RoomForm, RoomOptionVO, RoomQuery, RoomStatusForm, RoomVO } from './types';

export const listRoom = (query: RoomQuery): AxiosPromise<PageResult<RoomVO>> =>
  request({ url: '/property/resource/room/list', method: 'get', params: query });

export const getRoom = (id: number | string): AxiosPromise<RoomVO> =>
  request({ url: `/property/resource/room/${id}`, method: 'get' });

export const addRoom = (data: RoomForm) =>
  request({ url: '/property/resource/room', method: 'post', data });

export const updateRoom = (data: RoomForm) =>
  request({ url: '/property/resource/room', method: 'put', data });

export const changeRoomStatus = (data: RoomStatusForm) =>
  request({ url: '/property/resource/room/changeStatus', method: 'put', data });

export const delRoom = (ids: number | string | (number | string)[]) =>
  request({ url: `/property/resource/room/${ids}`, method: 'delete' });

export const exportRoom = (query: RoomQuery) =>
  download('/property/resource/room/export', query, `room_${Date.now()}.xlsx`);

export const roomOptions = (query: Pick<RoomQuery, 'projectId' | 'buildingId' | 'unitId'>): AxiosPromise<RoomOptionVO[]> =>
  request({ url: '/property/resource/room/options', method: 'get', params: query });
