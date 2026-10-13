import React from 'react';
import {Tabs} from '../shared/LmsUi.jsx';
import {navigate} from '../../lib/navigation.js';
export function ClassTabs({route,children}) {
 const items=route.area==='teacher'?[['overview','Tổng quan'],['students','Sinh viên'],['curriculum','Khung chương trình'],['assignments','Bài giao'],['labs','Thí nghiệm'],['grades','Điểm'],['materials','Học liệu lớp']]:[['overview','Tổng quan'],['learn','Học liệu'],['assignments','Bài tập'],['labs','Thí nghiệm'],['grades','Điểm']];
 return <Tabs items={items.map(([id,label])=>({id,label}))} activeId={route.section||'overview'} onChange={id=>navigate(`/${route.area}/classes/${route.id}${id==='overview'&&route.area==='student'?'':'/'+id}`)}>{()=>children}</Tabs>;
}
