// src/plugins/globalComponents.js
// 공통 컴포넌트 전역 등록 — import 없이 어디서든 사용 가능
import BaseButton from '@/components/common/BaseButton.vue'
import BaseInput  from '@/components/common/BaseInput.vue'
import BaseBadge  from '@/components/common/BaseBadge.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseModal  from '@/components/common/BaseModel.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'

export default {
  install(app) {
    app.component('BaseButton', BaseButton)
    app.component('BaseInput',  BaseInput)
    app.component('BaseBadge',  BaseBadge)
    app.component('BaseSelect', BaseSelect)
    app.component('BaseModal',  BaseModal)
    app.component('AppSidebar', AppSidebar)

  }
}