<template>
  <view class="page">
    <map class="map" :latitude="draft.location.latitude" :longitude="draft.location.longitude" :markers="markers" :scale="17" show-location @tap="pickCoordinate" />
    <view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="back" @tap="leaveEditor"><view></view></view><text>创建信标</text><view class="submit" :class="{ disabled: submitting }" @tap="submit">{{ submitting ? '提交中' : '提交审核' }}</view>
    </view>
    <scroll-view class="sheet" scroll-y>
      <view class="handle"></view>
      <view class="candidate-banner"><view class="candidate-icon"></view><view><text>候选信标</text><text>审核期间使用琥珀色候选样式，仅自己可见</text></view></view>
      <view class="coordinate-card">
        <view><text>当前坐标</text><text>{{ coordinateText }}</text></view>
        <view class="locate" @tap="useCurrentLocation">重新定位</view>
      </view>
      <view class="form-card">
        <label class="field"><text>信标名称 <text class="required">*</text></text><input v-model="draft.beacon.name" maxlength="40" placeholder="例如：天台观景点" /></label>
        <label class="field"><text>信标类型 <text class="required">*</text></text>
          <picker :range="typeNames" @change="draft.beacon.type = beaconTypes[$event.detail.value].id"><view class="picker-value">{{ currentTypeName }}<text>›</text></view></picker>
        </label>
        <label class="field description"><text>介绍与核验说明 <text class="required">*</text></text><textarea v-model="draft.beacon.description" maxlength="300" placeholder="说明该地点是什么、如何到达，以及为什么应成为公共信标" /></label>
      </view>
      <CreationMediaGrid v-model="draft.media" />
      <text v-if="errors.evidence" class="error">{{ errors.evidence }}</text>
      <view class="duplicate-card">
        <view class="duplicate-head"><view><text>重复地点检查</text><text>检查 150m 内同名地点和 50m 内位置冲突</text></view><view class="check-btn" @tap="runDuplicateCheck">重新检查</view></view>
        <view v-if="!duplicates.length" class="check-empty"><view></view><text>当前未发现明显重复地点</text></view>
        <view v-for="item in duplicates" :key="item.id" class="duplicate-row">
          <view><text>{{ item.name }}</text><text>{{ item.distance }}m · {{ item.level === 'strong' ? '强疑似重复' : '位置较近' }}</text></view>
          <view class="duplicate-action" @tap="linkExisting(item)">关联现有地点</view>
        </view>
      </view>
      <view v-if="history.length" class="history-card">
        <text class="section-title">我的共创记录</text>
        <view v-for="item in history" :key="item.id" class="history-row">
          <view><text>{{ item.draftSnapshot.beacon.name }}</text><text>{{ statusLabel(item.status) }}{{ item.moderation.reason ? ` · ${item.moderation.reason}` : '' }}</text></view>
          <view v-if="item.status === 'rejected'" class="appeal" @tap="appeal(item)">申诉</view>
        </view>
      </view>
      <text v-if="firstError" class="error">{{ firstError }}</text>
      <view class="safe-space"></view>
    </scroll-view>
  </view>
</template>
<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import CreationMediaGrid from '../../components/creation/CreationMediaGrid.vue'
import { beaconApi } from '../../utils/api/beacon.js'
import { creationApi, createCreationDraft, validateCreationDraft } from '../../utils/api/creation.js'
import { mediaUploadApi } from '../../utils/api/mediaUpload.js'
import { consumeCreationCommand, setActiveCreationDraft } from '../../utils/creationCommand.js'
const statusBarHeight=ref(20)
const submitting=ref(false)
const errors=reactive({})
const duplicates=ref([])
const draft=reactive(createCreationDraft('beacon',{location:{precision:'exact',name:'地图选点',address:'',latitude:30.572269,longitude:104.066541}}))
const beaconTypes=[{id:'place',name:'地点地标'},{id:'viewpoint',name:'观景点'},{id:'facility',name:'公共设施'},{id:'culture',name:'文化记忆'},{id:'route_node',name:'路线节点'}]
const typeNames=beaconTypes.map(item=>item.name)
const markers=computed(()=>[{id:1,latitude:Number(draft.location.latitude),longitude:Number(draft.location.longitude),width:30,height:38,iconPath:'/static/marker.png',callout:{content:'候选位置',display:'ALWAYS',color:'#92400e',bgColor:'#fffbeb',padding:7,borderRadius:10}}])
const coordinateText=computed(()=>`${Number(draft.location.latitude).toFixed(6)}, ${Number(draft.location.longitude).toFixed(6)}`)
const currentTypeName=computed(()=>beaconTypes.find(item=>item.id===draft.beacon.type)?.name||'地点地标')
const firstError=computed(()=>Object.values(errors).find(Boolean)||'')
const history=computed(()=>creationApi.listRecords().filter(item=>item.mode==='beacon'))
let saveTimer=null
watch(draft,value=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>creationApi.saveDraft(JSON.parse(JSON.stringify(value))),500)},{deep:true})
function pickCoordinate(event){const detail=event?.detail||event||{};if(Number.isFinite(Number(detail.latitude))&&Number.isFinite(Number(detail.longitude))){draft.location.latitude=Number(detail.latitude);draft.location.longitude=Number(detail.longitude);draft.location.address=coordinateText.value;runDuplicateCheck()}}
function useCurrentLocation(){uni.getLocation({type:'gcj02',success:result=>{draft.location.latitude=result.latitude;draft.location.longitude=result.longitude;draft.location.name='当前位置';draft.location.address=coordinateText.value;runDuplicateCheck()},fail:()=>uni.showToast({title:'定位失败，请在地图上手动选点',icon:'none'})})}
function existingItems(){
  const items=[...creationApi.getMapItems()]
  const nearby=uni.getStorageSync('BEACON_EXISTING_POINTS_V1')||[]
  nearby.forEach(item=>items.push({
    _id:item.id,
    name:item.name,
    location:{type:'Point',coordinates:[Number(item.longitude),Number(item.latitude)]}
  }))
  const last=uni.getStorageSync('INDEX_LAST_ITEM')
  if(last)items.push(last)
  const seen=new Set()
  return items.filter(item=>{const id=String(item._id||item.id||'');if(!id||seen.has(id))return false;seen.add(id);return true})
}
function runDuplicateCheck(){duplicates.value=beaconApi.checkDuplicates(draft,existingItems())}
function linkExisting(item){uni.showModal({title:'关联现有地点',content:`将本次证据补充到“${item.name}”，不再创建新信标。`,success:result=>{if(result.confirm){draft.beacon.linkedPointId=item.id;draft.beacon.name=item.name;uni.showToast({title:'已关联现有地点',icon:'none'})}}})}
async function submit(){
  if(submitting.value)return
  Object.keys(errors).forEach(key=>delete errors[key]);Object.assign(errors,validateCreationDraft(draft))
  runDuplicateCheck()
  if(Object.keys(errors).length)return
  if(duplicates.value.some(item=>item.level==='strong')&&!draft.beacon.linkedPointId)return uni.showModal({title:'发现疑似重复地点',content:'请关联现有地点，或返回补充名称和证据后再提交。',showCancel:false})
  submitting.value=true
  try{const record=await beaconApi.submit(draft,existingItems());uni.setStorageSync('CREATION_LAST_RECORD_ID',record.id);uni.redirectTo({url:`/pages/publish-success/index?id=${encodeURIComponent(record.id)}`})}
  catch(cause){if(cause.fields)Object.assign(errors,cause.fields);uni.showModal({title:'提交失败',content:cause.message||'请检查信息后重试',showCancel:false})}
  finally{submitting.value=false}
}
function appeal(item){uni.showModal({title:'提交申诉',editable:true,placeholderText:'补充说明或证据来源',success:result=>{if(result.confirm&&String(result.content||'').trim()){try{beaconApi.appeal(item.id,result.content);uni.showToast({title:'申诉已提交',icon:'none'})}catch(cause){uni.showToast({title:cause.message,icon:'none'})}}}})}
function statusLabel(status){return{review_pending:'审核中',published:'已成为公共信标',rejected:'审核未通过',scheduled:'等待提交'}[status]||status}
function leaveEditor(){uni.showModal({title:'保留信标草稿？',content:'保留后可以继续校正坐标和补充证据。',cancelText:'放弃',confirmText:'保留',success:result=>{if(result.confirm)creationApi.saveDraft(draft);else creationApi.removeDraft(draft.id);uni.navigateBack({fail:()=>uni.switchTab({url:'/pages/index/index'})})}})}
onLoad(()=>{
  try{const info=typeof uni.getWindowInfo==='function'?uni.getWindowInfo():uni.getSystemInfoSync();statusBarHeight.value=info.statusBarHeight||20}catch(error){}
  const command=consumeCreationCommand()
  const saved=creationApi.getLatestDraft('beacon')
  if(saved)Object.assign(draft,saved,{media:mediaUploadApi.restore(saved.media||[])})
  if(command?.createBeacon){Object.assign(draft.location,{precision:'exact',name:'地图长按选点',address:'',latitude:Number(command.createBeacon.latitude),longitude:Number(command.createBeacon.longitude)})}
  setActiveCreationDraft(draft.id);runDuplicateCheck()
})
</script>
<style scoped>
.page{position:relative;height:100vh;overflow:hidden;color: #0f172a;background: #e2e8f0}.map{width:100%;height:35vh}.nav{position:absolute;z-index:20;top:0;left:0;right:0;height:44px;padding-left:14px;padding-right:14px;display:flex;align-items:center;justify-content:space-between;box-sizing:content-box;background: rgba(255,255,255,.9);backdrop-filter:blur(14px)}.nav>text{font-size:17px;font-weight:800}.back,.submit{min-width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:14px}.back{background: #f1f5f9}.back view{width:10px;height:10px;border-left: 2px solid #334155;border-bottom: 2px solid #334155;transform:rotate(45deg)}.submit{padding:0 11px;color: #fff;background: #ea580c;font-size:12px;font-weight:750}.submit.disabled{opacity:.45}.sheet{position:absolute;z-index:10;left:0;right:0;bottom:0;height:68vh;padding:10px 14px;box-sizing:border-box;border-radius:26px 26px 0 0;background: var(--color-page);box-shadow:0 -12px 30px rgba(15,23,42,.12)}.handle{width:42px;height:5px;margin:0 auto 12px;border-radius:3px;background: #cbd5e1}.candidate-banner{min-height:62px;padding:9px 12px;display:flex;align-items:center;gap:11px;border-radius:17px;color: #92400e;background: #fffbeb}.candidate-icon{width:34px;height:34px;border: 3px dashed #d97706;border-radius:50%}.candidate-banner text{display:block}.candidate-banner text:first-child{font-size:13px;font-weight:800}.candidate-banner text:last-child{margin-top:3px;font-size:10px}.coordinate-card,.form-card,.duplicate-card,.history-card{margin-top:12px;padding:14px;border: 1px solid #eef2f7;border-radius:20px;background: #fff;box-shadow:0 8px 24px rgba(15,23,42,.05)}.coordinate-card{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:12px}.coordinate-card text{display:block}.coordinate-card text:first-child{font-size:12px;font-weight:700}.coordinate-card text:last-child{margin-top:4px;color: #64748b;font-size:10px;font-variant-numeric:tabular-nums}.locate,.check-btn,.duplicate-action,.appeal{min-width:72px;height:44px;padding:0 9px;display:flex;align-items:center;justify-content:center;border-radius:13px;color: #2563eb;background: #eff6ff;font-size:10px;font-weight:700}.field{display:block;padding:11px 0;border-bottom: 1px solid #f1f5f9}.field:last-child{border-bottom: 0}.field>text{display:block;font-size:12px;font-weight:700}.required,.error{color: #b91c1c}.field input,.field picker,.field textarea,.picker-value{width:100%;min-height:44px;margin-top:4px;display:flex;align-items:center;font-size:14px}.picker-value{justify-content:space-between}.picker-value text{font-size:20px;color: #94a3b8}.field textarea{min-height:98px;line-height:1.6}.duplicate-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.duplicate-head text{display:block}.duplicate-head text:first-child,.section-title{font-size:14px;font-weight:800}.duplicate-head text:last-child{margin-top:4px;color: #64748b;font-size:10px}.check-empty{min-height:58px;margin-top:10px;display:flex;align-items:center;gap:9px;color: #15803d;font-size:11px}.check-empty view{width:18px;height:18px;border: 2px solid #22c55e;border-radius:50%}.duplicate-row,.history-row{min-height:62px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top: 1px solid #f1f5f9}.duplicate-row text,.history-row text{display:block}.duplicate-row text:first-child,.history-row text:first-child{font-size:12px;font-weight:700}.duplicate-row text:last-child,.history-row text:last-child{margin-top:4px;color: #b45309;font-size:10px}.duplicate-action{color: #92400e;background: #eff6ff}.history-card>.section-title{display:block;margin-bottom:6px}.appeal{color: #b91c1c;background: #eff6ff}.error{display:block;margin:8px 4px;font-size:12px}.safe-space{height:calc(28px + env(safe-area-inset-bottom))}
</style>
