import icache from '@dojo/framework/core/middleware/icache';
import { create, tsx } from '@dojo/framework/core/vdom';
import Button from '@dojo/widgets/button';
import { Icon as DojoIcon } from '@dojo/widgets/icon';
import TwoColumnLayout from '@dojo/widgets/two-column-layout';

import { AssessmentMap, Level } from '../../interfaces';
import { store } from '../../middleware/store';
import { addAssessment, deleteAssessment, setFilters } from '../../processes/assessments.processes';
import { buildCopyUrl, copyToClipboard } from '../../util/clipboard';
import { getSkillAssessment, getSkillNames } from '../../util/skills';
import { AssessmentList } from '../assessment-list/AssessmentList';
import { Assessment } from '../assessment/Assessment';
import { Icon } from '../icon/Icon';
import { SkillKey } from '../skill-key/SkillKey';
import { SkillsetFilter } from '../skillset-filter/SkillsetFilter';
import TextInput from '../text-input/TextInput';
import * as css from './Compare.m.css';

const factory = create({ store, icache });

const SUCCESS_DURATION = 1250;

export const Compare = factory(function ({
	middleware: {
		icache,
		store: { get, path, executor }
	}
}) {
	const matrix = get(path('matrix'));
	const assessments = get(path('compare', 'assessments')).sort(({ name: nameA = '' }, { name: nameB = '' }) =>
		nameA < nameB ? -1 : 1
	);
	const assessmentsMap: AssessmentMap = icache.getOrSet('assessmentsMap', {});
	const filters = get(path('compare', 'filters')) || [];
	const showAll = icache.getOrSet<number[]>('showAll', []);
	const skills = Array.from(getSkillNames(matrix));
	const filterSet = new Set(filters);
	const isFiltering = filters.length > 0;

	const leading = (
		<div>
			<SkillsetFilter
				skills={skills}
				initialSelected={filters}
				onChange={(skills) => {
					executor(setFilters)({ filters: skills });
				}}
			/>
			<div classes={css.hashInput}>
				<TextInput
					key="hashInput"
					label="Combined Hash"
					initialValue={assessments
						.filter((assessment) => !assessmentsMap[assessment.hash])
						.map((assessment) => assessment.hash)
						.join(',')}
					disabled
				>
					{{
						trailing: (
							<Button
								classes={{
									'@dojo/widgets/button': {
										root: [css.copyButton, icache.get('success') && css.successButton]
									}
								}}
								onClick={() => {
									copyToClipboard(
										buildCopyUrl(
											assessments
												.filter((assessment) => !assessmentsMap[assessment.hash])
												.map((assessment) => assessment.hash)
										)
									);
									icache.set('success', true);
									setTimeout(() => {
										icache.set('success', false);
									}, SUCCESS_DURATION);
								}}
							>
								{icache.get('success') ? <DojoIcon type="checkIcon" /> : <Icon icon="copy" />}
							</Button>
						)
					}}
				</TextInput>
			</div>
			<SkillKey />
			<AssessmentList
				assessments={assessments}
				assessmentsMap={assessmentsMap}
				onAdd={async (hash) => {
					await executor(addAssessment)({ hash });
				}}
				onChange={(hash, active) => {
					icache.set('assessmentsMap', {
						...assessmentsMap,
						[hash]: active
					});
				}}
				onRemove={(assessment) => {
					executor(deleteAssessment)({ hash: assessment.hash });
				}}
			/>
		</div>
	);

	const trailing = (
		<div>
			{assessments.map(({ hash, name = '', skills }, i) => {
				if (assessmentsMap[hash]) {
					return undefined;
				}
				const shouldShowAll = showAll.includes(i);
				const skillAssessments = Array.from(getSkillAssessment(skills)).filter(
					({ skill, level }) => level > Level.None && (!isFiltering || shouldShowAll || filterSet.has(skill))
				);
				const toggleShowAll = () => {
					const filteredShowAll = showAll.filter((value) => value !== i);
					if (filteredShowAll.length === showAll.length) {
						filteredShowAll.push(i);
					}
					icache.set('showAll', filteredShowAll);
				};
				return (
					<Assessment title={name} skillAssessments={skillAssessments}>
						{isFiltering && (
							<span classes={css.showToggle} onclick={toggleShowAll}>
								{shouldShowAll ? 'See Less' : 'See All'}
							</span>
						)}
					</Assessment>
				);
			})}
		</div>
	);

	return (
		<div classes={css.root}>
			<TwoColumnLayout
				classes={{
					'@dojo/widgets/two-column-layout': {
						root: [css.layoutRoot],
						column: [css.column]
					}
				}}
			>
				{{
					leading,
					trailing
				}}
			</TwoColumnLayout>
		</div>
	);
});
