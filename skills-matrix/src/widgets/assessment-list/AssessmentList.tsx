import icache from '@dojo/framework/core/middleware/icache';
import { create, tsx } from '@dojo/framework/core/vdom';
import Button from '@dojo/widgets/button';
import Checkbox from '@dojo/widgets/checkbox';
import Icon from '@dojo/widgets/icon';

import { Assessment, AssessmentMap } from '../../interfaces';
import { cleanCopyUrl } from '../../util/clipboard';
import TextInput from '../text-input/TextInput';
import * as css from './AssessmentList.m.css';

export interface AssessmentListProperties {
	assessments: Assessment[];
	assessmentsMap: AssessmentMap;
	onAdd(hash: string): void;
	onChange(hash: string, active: boolean): void;
	onRemove(assessment: Assessment): void;
}

const factory = create({ icache }).properties<AssessmentListProperties>();

const Widget = factory(function ({ middleware: { icache }, properties, children }) {
	const { assessments, assessmentsMap, onAdd, onChange, onRemove } = properties();
	const closingHash = icache.get('closingHash');
	const newHash = icache.get('newHash');

	return (
		<div classes={css.root}>
			<h1 classes={css.title}>Users</h1>
			<div>
				{assessments.map((assessment) => (
					<div classes={css.row} key={assessment.hash}>
						{closingHash === assessment.hash ? (
							<virtual>
								<div classes={css.deleteText}>Delete {assessment.name}?</div>
								<div
									classes={css.yes}
									onclick={() => {
										onRemove(assessment);
										icache.set('closingHash', undefined);
									}}
								>
									Yes
								</div>
								<div classes={css.no} onclick={() => icache.set('closingHash', undefined)}>
									No
								</div>
							</virtual>
						) : (
							<virtual>
								<Checkbox
									classes={{
										'@dojo/widgets/checkbox': {
											root: [css.checkbox],
											inputWrapper: [css.inputWrapper],
											input: [css.input]
										}
									}}
									checked={!assessmentsMap[assessment.hash]}
									onValue={(checked) =>
										checked ? onChange(assessment.hash, false) : onChange(assessment.hash, true)
									}
								>
									{assessment.name}
								</Checkbox>
								<div classes={css.close} onclick={() => icache.set('closingHash', assessment.hash)}>
									<Icon type="closeIcon" />
								</div>
							</virtual>
						)}
					</div>
				))}
				<div classes={css.addControls}>
					{icache.get('editing') ? (
						<TextInput placeholder="Enter Hash" onValue={(value) => icache.set('newHash', value)}>
							{{
								trailing: (
									<Button
										classes={{
											'@dojo/widgets/button': {
												root: [
													css.inputButton,
													newHash && newHash.trim().length > 0 && css.allowed
												]
											}
										}}
										disabled={!newHash || newHash.trim().length === 0}
										onClick={async () => {
											try {
												await onAdd(cleanCopyUrl(newHash));
												icache.set('newHash', undefined);
												icache.set('editing', false);
											} catch (error) {}
										}}
									>
										<Icon type="checkIcon" />
									</Button>
								)
							}}
						</TextInput>
					) : (
						<div classes={css.add} onclick={() => icache.set('editing', true)}>
							<Icon type="plusIcon" /> Add Hash
						</div>
					)}
				</div>
			</div>
		</div>
	);
});

export { Widget as AssessmentList };
