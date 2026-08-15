from pathlib import Path
p=Path('scripts/organization_v64.js')
s=p.read_text(encoding='utf-8')
old="""function refuseOffer(f,o,total){const arr=(f.organizationOffers||[]).filter(x=>x.id!==o.id);f.organizationOffers=arr;if(f.contract){registerContractRefusal(f,o,'Отказ менеджера от предложенного боя')}if(!f.contract&&!arr.length){registerFreeRefusal(f,total,total)}else if(!f.contract){f.reputationHooks.refused++;f.refusalHistory.push({day:day(),type:'free_partial',rejected:1,total})}save();if(!f.contract&&arr.length){renderOfferList(f,arr);toast('Предложение отклонено. Остальные предложения остаются.');return}closeModal();page('home')}"""
new="""function refuseOffer(f,o,total){const arr=(f.organizationOffers||[]).filter(x=>x.id!==o.id);f.organizationOffers=arr;if(f.contract){registerContractRefusal(f,o,'Отказ менеджера от предложенного боя')}if(!f.contract&&!arr.length){const batch=Math.max(1,num(f.refusalOfferBatchSize,total||1));registerFreeRefusal(f,batch,batch);f.refusalOfferBatchSize=0}else if(!f.contract){const batch=Math.max(1,num(f.refusalOfferBatchSize,total||1));f.reputationHooks.refused++;f.refusalHistory.push({day:day(),type:'free_partial',rejected:1,total:batch})}save();if(!f.contract&&arr.length){renderOfferList(f,arr);toast('Предложение отклонено. Остальные предложения остаются.');return}closeModal();page('home')}"""
if old not in s:
    raise SystemExit('refuseOffer pattern not found')
s=s.replace(old,new,1)
old2="""f.organizationOffers=offers;save();return offers}"""
new2="""f.organizationOffers=offers;f.refusalOfferBatchSize=offers.length;save();return offers}"""
if old2 not in s:
    raise SystemExit('generateOffers pattern not found')
s=s.replace(old2,new2,1)
# Also make the final cooldown explicitly use the number of offers in the batch, not the number left after each refusal.
s=s.replace("const days=freePenalty(r);f.offerCooldownUntil", "const days=freePenalty(t);f.offerCooldownUntil", 1)
p.write_text(s,encoding='utf-8')
print('V66 refusal batch fix applied')
